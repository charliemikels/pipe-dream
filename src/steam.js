
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from "gi://GLib";
import Soup from "gi://Soup";

Gio._promisify(
    Soup.Session.prototype,
    "send_and_read_async",
    "send_and_read_finish",
);

const http_session = new Soup.Session();
// const article_text_view = workbench.builder.get_object("article_text_view");
// const article_title = workbench.builder.get_object("article_title");

async function getMyWishlist(steamUserId) {
    const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${steamUserId}`

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

    // console.log(json.response.items)
    // for (const element of json.response.items) {
    //     console.log(element.appid)
    // }

    return json.response.items

    // See: `https://api.steampowered.com/ISteamApps/GetAppList/v2/` to get a catalogue of every steam app and it's name
    // See: `https://store.steampowered.com/api/appdetails?appids=${appid}`
    // returns data.name and data.header_image  (Also data.screenshots, data.background, and data.support_info.url)
    //
    // See: `https://store.steampowered.com/app/${appid}`

    // await getReleventDetails(json.response.items[1].appid).catch(console.error)
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

// getMyWishlist("76561198108145031").catch(console.error)
// console.log( await getReleventDetails("3146520").catch(console.error) )



// Gio._promisify(Gtk.FileDialog.prototype, "save", "save_finish");
// Gio._promisify(
//   Gio.File.prototype,
//   "replace_contents_async",
//   "replace_contents_finish",
// );
//
// const dataDir = GLib.get_user_config_dir();
// const destination = GLib.build_filenamev([dataDir, 'pipedream', 'config.json']);
// const dataJSON = new TextEncoder().encode(
//     JSON.stringify({
//         pie: "hello world",
//         fish: "new entry",
//         time: 1000
//     })
// );

// const file = Gio.File.new_for_path(destination);

// if (! file.get_parent().query_exists(null)) {
//   file.get_parent().make_directory_with_parents(null)
// }

// await file.replace_contents_async(
//     dataJSON,
//     null,
//     false,
//     Gio.FileCreateFlags.NONE,
//     null,
// );

// console.log(destination, dataJSON)


// -----------------------------------------------------------------------------


export async function fetch_steam_user_info(steam_user_id) {
    console.log("Running Steam logic for ID:", steam_user_id);

    const list = await getMyWishlist(steam_user_id)
    console.log(list)
    return list
}
