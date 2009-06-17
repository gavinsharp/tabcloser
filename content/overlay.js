/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is TabCloser.
 *
 * The Initial Developer of the Original Code is
 * Gavin Sharp <gavin@gavinsharp.com>.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

var tabcloser = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("tabcloser-strings");

    this.tabMenu = document.getAnonymousElementByAttribute(getBrowser(), "anonid", "tabContextMenu");
    var self = this;
    this.tabMenu.addEventListener("popupshowing", function() { self.onMenuShowing(); }, false);

    // Add the menu item
    var closeTabMenuitem = this.tabMenu.getElementsByAttribute("id",
                                                          "context_closeTab")[0];
    var newButton = document.createElement("menuitem");
    newButton.setAttribute("accesskey",
                           this.strings.getString("closeTabsForSite.accesskey"));
    newButton.setAttribute("oncommand", "tabcloser.onMenuItemCommand(event);");
    this.contextMenuItem = this.tabMenu.insertBefore(newButton, closeTabMenuitem);
    
    Components.utils.import("resource://gre/modules/PluralForm.jsm");
  },

  onMenuShowing: function (e) {
    try {
      // Might throw if current tab has no host...
      var host = gBrowser.mContextTab.linkedBrowser.currentURI.host;
    } catch (ex) {
      // ... so just hide the menu item
      this.contextMenuItem.hidden = true;
      return;
    }

    this.contextMenuItem.hidden = false;
    var tabCount = this.getTabsToClose(host).length;
    var label = this.strings.getFormattedString("closeTabsForSite.label",
                                                [host]);
    label = PluralForm.get(tabCount, label).replace("#1", tabCount);
    this.contextMenuItem.setAttribute("label", label);
  },

  onMenuItemCommand: function(e) {
    var host = gBrowser.mContextTab.linkedBrowser.currentURI.host;
    var tabsToClose = this.getTabsToClose(host);

    var message = this.strings.getFormattedString("areYouSure.message",
                                                  [host]);
    message = PluralForm.get(tabsToClose.length, message)
                        .replace("#1", tabsToClose.length);
    
    var title = this.strings.getString("areYouSure");
    var promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"].
                        getService(Ci.nsIPromptService);
    
    // don't prompt if there's only one tab
    if (tabsToClose.length == 1 || promptService.confirm(window, title, message)) {
      tabsToClose.forEach(function (t) {
        // work around some strange bug in 3.0.x that causes removeTab to fail
        // silently when closing the last tab this way. This isn't needed on
        // trunk...
        if (gBrowser.mTabs.length == 1)
          closeWindow(true);
        else
          gBrowser.removeTab(t);
      });
    }
  },

  getTabsToClose : function(host) {
    var tabsToClose = [];
    var tabCount = gBrowser.mTabs.length;
    for (var i = tabCount - 1; i >= 0; i--) {
      var tab = gBrowser.mTabs[i];
      var browser = gBrowser.getBrowserForTab(tab);
      try {
        var tabHost = browser.currentURI.host;
      } catch (ex) {
        // Ignore failure to get .host
        continue;
      }
      if (host == tabHost) {
        tabsToClose.push(tab);
      }
    }
    
    return tabsToClose;
  }

};
window.addEventListener("load", function(e) { tabcloser.onLoad(e); }, false);
