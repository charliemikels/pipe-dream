/* main.js
 *
 * Copyright 2025 Charlie
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import GLib from "gi://GLib";
import Soup from "gi://Soup";

import { PipeDreamWindow } from './window.js';

pkg.initGettext();
pkg.initFormat();

export const PipeDreamApplication = GObject.registerClass(
    class PipeDreamApplication extends Adw.Application {
        constructor() {
            super({
                application_id: 'place.pumpkin.pipedream',
                flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
                resource_base_path: '/place/pumpkin/pipedream'
            });

            const quit_action = new Gio.SimpleAction({name: 'quit'});
                quit_action.connect('activate', action => {
                this.quit();
            });
            this.add_action(quit_action);
            this.set_accels_for_action('app.quit', ['<primary>q']);

            const show_about_action = new Gio.SimpleAction({name: 'about'});
            show_about_action.connect('activate', action => {
                const aboutParams = {
                    application_name: 'pipe-dream',
                    application_icon: 'place.pumpkin.pipedream',
                    developer_name: 'Charlie',
                    version: '0.1.0',
                    developers: [
                        'Charlie'
                    ],
                    // Translators: Replace "translator-credits" with your name/username, and optionally an email or URL.
                    translator_credits: _("translator-credits"),
                    copyright: '© 2025 Charlie'
                };
                const aboutDialog = new Adw.AboutDialog(aboutParams);
                aboutDialog.present(this.active_window);
            });
            this.add_action(show_about_action);
        }

        vfunc_activate() {
            let {active_window} = this;

            if (!active_window)
                active_window = new PipeDreamWindow(this);

            active_window.present();
        }
    }
);

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
    for (const element of json.response.items) {
        console.log(element.appid)
    }

    return json.response.items

    // See: `https://api.steampowered.com/ISteamApps/GetAppList/v2/` to get a catalogue of every steam app and it's name
    // See: `https://store.steampowered.com/api/appdetails?appids=${appid}`
    // returns data.name and data.header_image  (Also data.screenshots, data.background, and data.support_info.url)
    //
    // See: `https://store.steampowered.com/app/${appid}`

    // await getReleventDetails(json.response.items[1].appid).catch(console.error)
}

async function getReleventDetails(appid) {
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

getMyWishlist("76561198108145031").catch(console.error)
console.log( await getReleventDetails("3146520").catch(console.error) )



// Gio._promisify(Gtk.FileDialog.prototype, "save", "save_finish");
Gio._promisify(
  Gio.File.prototype,
  "replace_contents_async",
  "replace_contents_finish",
);

const dataDir = GLib.get_user_config_dir();
const destination = GLib.build_filenamev([dataDir, 'pipedream', 'config.json']);
const dataJSON = new TextEncoder().encode(
    JSON.stringify({
        pie: "hello world",
        fish: "new entry",
        time: 1000
    })
);

const file = Gio.File.new_for_path(destination);

if (! file.get_parent().query_exists(null)) {
  file.get_parent().make_directory_with_parents(null)
}

await file.replace_contents_async(
    dataJSON,
    null,
    false,
    Gio.FileCreateFlags.NONE,
    null,
);

console.log(destination, dataJSON)


export function main(argv) {
    const application = new PipeDreamApplication();
    console.log("hello world");

    return application.runAsync(argv);
}
