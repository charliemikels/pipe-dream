/* window.js
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
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

import { fetch_steam_user_info } from './steam.js';

export const PipedreamWindow = GObject.registerClass({
    GTypeName: 'PipedreamWindow',
    Template: 'resource:///place/pumpkin/pipedream/window.ui',
    InternalChildren: [
        'steam_user_id_entry',
        'toast_overlay',
        'stack',
        'id_entry_page',
        'loading_spinner_page'
    ],
}, class PipedreamWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        this._steam_user_id_entry.connect('apply', () => {
            this.setUserId();
        });
    }

    async setUserId() {
        const user_id = this._steam_user_id_entry.get_text();
        console.log("User ID:", user_id);
        this._stack.set_visible_child(this._loading_spinner_page);
        const result = await fetch_steam_user_info(user_id);

        if (result.list == null) {
            // For whatever reason, a list was not generated.
            this._stack.set_visible_child(this._id_entry_page);

            const toast = new Adw.Toast({
                title: `Could not load wishlist for user ID ${user_id}. Status code ${result.status}.`,
            });
            this._toast_overlay.add_toast(toast);
        } else {
            console.log("Success")
            this._toast_overlay.dismiss_all()
            // TODO: Make a third page displaying results of lookup
        }
    }
});

