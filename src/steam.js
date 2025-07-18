
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from "gi://GLib";
import Soup from "gi://Soup";

Gio._promisify(
    Soup.Session.prototype,
    "send_and_read_async",
    "send_and_read_finish",
);
Gio._promisify(
    Gio.File.prototype,
    "replace_contents_async",
    "replace_contents_finish",
);
Gio._promisify(
    Gio.File.prototype,
    'load_contents_async',
    'load_contents_finish'
);

const http_session = new Soup.Session();

async function getMyWishlist(steamUserId) /*returns results (can be null), and status code*/ {
    const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${steamUserId}`
    const message = Soup.Message.new("GET", url);
    const results = { list: null, status: null }

    const bytes = await http_session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
    );

    results.status = message.get_status()
    if (message.get_status() !== Soup.Status.OK) {
        console.error(`HTTP Status ${message.get_status()}`);
        results.list = null
        return results
    }

    const text_decoder = new TextDecoder("utf-8");
    const decoded_text = text_decoder.decode(bytes.toArray());
    const json = JSON.parse(decoded_text);

    results.list = json.response.items

    return results

    // See: `https://api.steampowered.com/ISteamApps/GetAppList/v2/` to get a catalogue of every steam app and it's name
    // See: `https://store.steampowered.com/api/appdetails?appids=${appid}`
    // returns data.name and data.header_image  (Also data.screenshots, data.background, and data.support_info.url)
    //
    // See: `https://store.steampowered.com/app/${appid}`
}

async function getReleventAppDetails(appid) {
    // TODO: Check if the data is cashed before fetching again.
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}`
    // although the name implies that we can list multiple app IDs, this feature was disabled on steam's end, and we have to go one-by-one.

    const message = Soup.Message.new("GET", url);
    const bytes = await http_session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
    );
    if (message.get_status() !== Soup.Status.OK) {
        console.error(`HTTP Status ${message.get_status()}`);
        return;
    }
    const text_decoder = new TextDecoder("utf-8");
    const decoded_text = text_decoder.decode(bytes.toArray());
    const json = JSON.parse(decoded_text);
    if (json[appid].success) {
        return {
            appid: appid,
            name: json[appid].data.name,
            image: json[appid].data.header_image,
        }
    } else {
        console.error(`getting data for appid ${appid} did not succeed`)
    }
}

// console.log( await getReleventDetails("3146520").catch(console.error) )

var steam_catalogue = null
var steam_catalogue_update_date = null
const cashe_catalogue_path = GLib.build_filenamev([GLib.get_user_cache_dir(), 'pipedream', 'catalogue.json']);

async function refresh_catalogue() {
    const catalogue_url = "https://api.steampowered.com/ISteamApps/GetAppList/v2/"
    const message = Soup.Message.new("GET", catalogue_url);

    console.log("requesting catalogue from steam's network")
    const bytes = await http_session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
    );
    if (message.get_status() !== Soup.Status.OK) {
        console.error(`HTTP Status ${message.get_status()}`);
        return;
    }

    const text_decoder = new TextDecoder("utf-8");
    const decoded_text = text_decoder.decode(bytes.toArray());

    const new_catalogue_full = JSON.parse(decoded_text);
    // crush full catalogue from applist.apps.[{appid: n, name: x}]
    // to just {appid: name}
    const new_catalogue = new_catalogue_full.applist.apps.reduce(
        (accumulator, current_value) => {
            accumulator[current_value.appid] = current_value.name
            return accumulator
        },
        {}
    );

    // cache catalogue to file
    const catalogue_data_json = new TextEncoder().encode(
        JSON.stringify(new_catalogue)
    );
    const cache_file = Gio.File.new_for_path(cashe_catalogue_path);

    if (! cache_file.get_parent().query_exists(null) ) {
        cache_file.get_parent().make_directory_with_parents(null)
    }

    await cache_file.replace_contents_async(
        catalogue_data_json,
        null,
        false,
        Gio.FileCreateFlags.NONE,
        null,
    );

    // const new_catalogue_full = JSON.parse(decoded_text);
    steam_catalogue = new_catalogue
    steam_catalogue_update_date = Date.now()
    return steam_catalogue
}

export async function get_cataloge() {
    if (steam_catalogue) { return steam_catalogue }

    const cache_file = Gio.File.new_for_path(cashe_catalogue_path);
    if (! cache_file.query_exists(null) ) {
        // no catalogue file. Refresh from network.
        await refresh_catalogue()
        return steam_catalogue
    }

    // load catalogue from cache file
    let contentsBytes;
    try {
        // Retrieve contents asynchronously
        // The first index of the returned array contains a byte
        // array of the contents
        contentsBytes = (await cache_file.load_contents_async(null))[0];
    } catch (e) {
        logError(e, `Unable to open ${cache_file.peek_path()}`);
        return await refresh_catalogue();
    }

    let decoded_text;
    try {
        const text_decoder = new TextDecoder("utf-8");
        decoded_text = text_decoder.decode(contentsBytes);
    } catch (e) {
        logError(e, "unable to decode file bytes to utf8.")
        return await refresh_catalogue();
    }

    const new_catalogue = JSON.parse(decoded_text);
    steam_catalogue = new_catalogue
    return steam_catalogue
}

async function get_app_name(appid) {
    let catalogue = await get_cataloge()
    if (catalogue[appid]) { return catalogue[appid] }

    console.log(`AppID ${appid} not found in current catalogue.`)
    if (!steam_catalogue_update_date || Date.now() - steam_catalogue_update_date >= 5 * 60 * 1000 ) {
        await refresh_catalogue()
        return await get_app_name(appid)
    } else {
        console.warn(`Catalogue was refreshed too recently and App ${appid} is still not known, using a placeholder instead.`)
    }
    return `Placeholder: app ${appid}`
}


export const WishlistGame = GObject.registerClass(
  {
    Properties: {
      name: GObject.ParamSpec.string(
        "name",
        null,
        null,
        GObject.ParamFlags.READWRITE,
        "",
      ),
      appid: GObject.ParamSpec.int64(
        "appid",
        null,
        null,
        GObject.ParamFlags.READWRITE,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
        0,
      ),
      wishlistpriority: GObject.ParamSpec.int64(
        "wishlistpriority",
        null,
        null,
        GObject.ParamFlags.READWRITE,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
        0,
      ),
      // dateadded: GObject.ParamSpec.int64(
      //   "dateadded",
      //   null,
      //   null,
      //   GObject.ParamFlags.READWRITE,
      //   Number.MIN_SAFE_INTEGER,
      //   Number.MAX_SAFE_INTEGER,
      //   0,
      // ),
    },
  },
  class WishlistGame extends GObject.Object {},
)

export async function fetch_steam_user_info(steam_user_id) {
    // Get wishlist
    const results = await getMyWishlist(steam_user_id)
    if ( results.list == null) { return results }

    const wishlist_games = []
    for (const entry of results.list) {
        console.log(entry)
        console.log(entry.appid)
        const wishlist_game = new WishlistGame({
            name: await get_app_name(entry.appid.toString()),
            appid: entry.appid,
            wishlistpriority: entry.priority,
            // dateadded: TODO
        });
        wishlist_games.push(wishlist_game)
    }

    const data_model = new Gio.ListStore({ item_type: WishlistGame });
    data_model.splice(0, 0, wishlist_games);
    results.data_model = data_model

    return results
    // console.log(list)
    // return results, http_code
}
