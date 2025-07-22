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


import { PipedreamWindow } from './window.js';
import { get_catalog } from './steam.js';

pkg.initGettext();
pkg.initFormat();

export const PipedreamApplication = GObject.registerClass(
    class PipedreamApplication extends Adw.Application {
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
                active_window = new PipedreamWindow(this);

            active_window.present();
        }
    }
);

get_catalog()  // pre-load steam catalog. We don't need the return value, just kick it off early in case we need to do network stuff.

export function main(argv) {
    const application = new PipedreamApplication();
    console.log("hello world");

    return application.runAsync(argv);
}
