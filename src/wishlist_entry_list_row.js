import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

export const WishlistEntryListRow = GObject.registerClass({
  GTypeName: 'WishlistEntryListRow',
  Template: 'resource:///place/pumpkin/pipedream/wishlist_entry_list_row.ui',
  InternalChildren: ['app_name_label', 'app_id_label'],
}, class WishlistEntryListRow extends Gtk.Box {
  setData(data) {
    this._app_name_label.label = data.app_name;
    this._app_id_label.label = data.app_id.toString();
  }
});
