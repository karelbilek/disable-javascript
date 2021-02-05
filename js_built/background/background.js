'use strict';

var browser = browser;



(function(browser) {
  // Local variables.
  var defaultSettings = {
    'setting-default_state': 'on',
    'setting-disable_behavior': 'domain',
    'setting-shortcuts': true,
    'setting-context_menu': true
  };
  var _settingsPrefix = 'setting-';
  var _defaultState = 'on';
  var _disableBehavior = 'domain';
  var _shortcuts = true;
  var _contextMenu = true;

  async function updateBlockerJSON() {
  console.log("updateblockerjson before build")
    const j = await getSafariBlockerJSON();
    const jj = JSON.stringify(j);

    console.log("sending ", jj)
  
    browser.runtime.sendNativeMessage("application.id", {message: jj}, function(response) {
        console.log("Received sendNativeMessage response:");
        console.log(response);
    });
  }

  async function getSafariBlockerJSON() {
    const defaultState = await getDefaultState();
    const isDefaultState = defaultState === 'on';
    const buildList = await browser.storage.local.get();
    const entries = [];
    let hasEntries = false;

    for (let key in buildList) {
      if (!key.startsWith(_settingsPrefix)) {
        entries.push(key);
        hasEntries = true;
      }
    }

    if (!hasEntries) {
      return [];
    }

    const rules = []
  
    for (var i = 0; i < entries.length; i++) {
        var key = entries[i];
        var includeSubDomains = false;

console.log(buildList);
console.log(key);
console.log("help")
        if (!(typeof buildList[key] === 'string')) {
          includeSubDomains = buildList[key]['include-subdomains'];
        }
        let start = "^https?://"
        if (includeSubDomains) {
          start = "^https?://([^/]*)?\\."
        }

        const dom = key.replaceAll(".", "\\.");
        const all = start + dom + "(/.*)?$"
        rules.push(all)
    }

    const filt = isDefaultState ? "if-top-url" : "unless-top-url";

    const res = [
      {
          "action": {
              "type": "block"
          },
          "trigger": {
              "url-filter": ".*",
            // "if-top-url": ["^https?://([^/]*)?\\.idnes\\.cz(/.*)?$"],
              "resource-type": ["script"]
          }
      }
    ]
    res[0].trigger[filt] = rules;
    return res;
  }

  browser.storage.onChanged.addListener(updateBlockerJSON)

  /**
   * Determines wheter JS could be disabled for the given url.
   */
  function isApplicableUrl(url) {
    var host = new URL(url).hostname;

    if (host.trim().length === 0 || host === 'newtab' || host === 'startpage') {
      return false;
    }

    return true;
  }

  /**
   * Returns the correct app icon depending on the browser and JS status.
   */
  function getIcon(jsEnabled, tabId, url) {
    var icon = {};


      icon.path = {
        '48': jsEnabled ? 'icons/48/js-on.png' : 'icons/48/js-off.png',
        '128': jsEnabled ? 'icons/128/js-on.png' : 'icons/128/js-off.png'
      };


    if (typeof tabId !== 'undefined') {
      icon.tabId = tabId;
    }

    if (typeof url !== 'undefined') {
      if (!isApplicableUrl(url)) {

          icon.path = {
            '48': jsEnabled ? 'icons/48/js-on-grey.png' : 'icons/48/js-off-grey.png',
            '128': jsEnabled ? 'icons/128/js-on-grey.png' : 'icons/128/js-off-grey.png'
          };

      }
    }

    return icon;
  }

  /**
   * Gets the setting value for a key.
   */
  function getSetting(name) {
    name = _settingsPrefix + name;

    return new Promise(function(resolve) {
      browser.storage.local.get(name).then(function(items) {
        resolve(items[name]);
      });
    });
  }

  /**
   * Returns a promise with the default state value.
   */
  function getDefaultState() {
    return new Promise(function(resolve) {
      getSetting('default_state').then(function(result) {
        resolve(result);
      });
    });
  }


  /**
   * Checks if a host is listed.
   *
   * Returns a promise containing one of these values:
   * 0: The host is not listed at all.
   * 1: The host is listed directly.
   * 2: The host is listed via it's base domain.
   */
  function isListedHost(host) {
    return new Promise(function(resolve) {
      var hosts = [host];
      var hostParts = host.split('.');

      if (hostParts.length > 1) {
        // This is a sub-domain, let's also check for the base domain.
        var baseHost = hostParts[hostParts.length-2] + '.' + hostParts[hostParts.length-1];
        hosts.push(baseHost);
      }

        browser.storage.local.get(hosts).then(function(items) {
          var isListed = host in items;

          if (isListed) {
            // This domain is listed directly.
            resolve(1);
          }

          if (baseHost in items) {
            if (items[baseHost].hasOwnProperty('include-subdomains') && items[baseHost]['include-subdomains'] === true) {
              // This domain is listed by the base domain.
              resolve(2);
            }
          }

          resolve(0);
        });
    });
  }

  /**
   * Checks if JS is enabled for a given host and tab.
   */
  function isJSEnabled(host, tabId) {
       
    return new Promise(function(resolve) {
      getDefaultState().then(function(defaultState) {
            // Disable behavior by domain.
            isListedHost(host).then(function(listed) {
              var jsEnabled = false;

              if ((defaultState === 'on' && !listed) || (defaultState !== 'on' && listed)) {
                jsEnabled = true;
              }

              resolve(jsEnabled);
            });
      });
    });
  }

  /**
   * Helper to ensure that at least default settings are set.
   */
  function ensureSettings(settingValues) {
    for (var setting in defaultSettings) {
      if (!settingValues.hasOwnProperty(setting)) {
        // Setting didn't exist yet, fallback to default value.
        var settingObject = {};
        settingObject[setting] = defaultSettings[setting];

        browser.storage.local.set(settingObject);
      } else {
        // Setting exists, make sure we have the correct setting value in our
        // application scope.
        var settingValue = settingValues[setting];

        if (typeof settingValue !== 'undefined') {
          switch (setting) {
            case 'setting-default_state':
              _defaultState = settingValue;
              break;

            case 'setting-disable_behavior':
              _disableBehavior = settingValue;
              break;

            case 'setting-shortcuts':
              _shortcuts = settingValue;
              break;

            case 'setting-context_menu':
              _contextMenu = settingValue;
              break;
          }
        }
      }
    }

    // After ensuring we have our correct setting values, initialize
    // a few features.
    toggleShortcuts();
    toggleContextMenu();
  }

  /**
   * Helper to ensure that at least default settings are set.
   */
  function preEnsureSettings() {
    var settingNames = [];

    for (var setting in defaultSettings) {
      settingNames.push(setting);
    }

      browser.storage.local.get(settingNames).then(ensureSettings);

  }

  /**
   * Handle web extension updates.
   */
  function handleUpdate(settingValues) {
    var manifest = browser.runtime.getManifest();
    var prevVersion = '1.0.0';
    var thisVersion = manifest.version;
    var anyChange = false;
    var majorChange = false;
    var minorChange = false;
    var patchChange = false;

    if (settingValues.hasOwnProperty('setting-version')) {
      prevVersion = settingValues['setting-version'];
    }

    var prevParts = prevVersion.split('.');
    var thisParts = thisVersion.split('.');

    if (prevParts[0] !== thisParts[0]) {
      anyChange = true;
      majorChange = true;
    } else if (prevParts[1] !== thisParts[1]) {
      anyChange = true;
      minorChange = true;
    } else if (prevParts[2] !== thisParts[2]) {
      anyChange = true;
      patchChange = true;
    }

    if (majorChange || minorChange) {
      // We have a major or minor web extension update, show the about page.
      browser.tabs.create({url: './pages/about.html'});
    }

    if (anyChange) {
      // The web extension was updated, store our new version into our local storage.
      var settingObject = {};
      settingObject['setting-version'] = thisVersion;

      browser.storage.local.set(settingObject);
    }

    if (anyChange && parseInt(prevParts[0]) <= 2) {
      // Make sure we don't have any empty urls in the block-/allow-list.
      browser.storage.local.remove('');
    }
  }


  /**
   * Toggles the JS state of a given tab.
   */
  function toggleJSState(tab) {
    var host = new URL(tab.url).hostname;

    if (!isApplicableUrl(tab.url)) {
      // Don't do anything if this is not an applicable url.
      return;
    }

    isListedHost(host).then(function(listed) {
      if (listed === 1) {
        // The host is listed directly.
        browser.storage.local.remove(host).then(function() {
          browser.tabs.reload({bypassCache: true});
        });

      } else if (listed === 2) {
        // The host is listed via it's base domain.
        var hostParts = host.split('.');
        var baseHost = hostParts[hostParts.length-2] + '.' + hostParts[hostParts.length-1];

          browser.storage.local.remove(baseHost).then(function() {
            browser.tabs.reload({bypassCache: true});
          });

      } else {
        // The host is not listed at all.
        var item = {};

        item[host] = (new Date()).toISOString();

          browser.storage.local.set(item).then(function() {
            browser.tabs.reload({bypassCache: true});
          });

      }
    });

  }

  /**
   * Listen to shortcut commands.
   */
  var commandListener = function(command) {
    switch (command) {
      case 'toggle-state':
          browser.tabs.query({active:true}).then(function(tab) {
            toggleJSState(tab[0]);
          });

        break;

      case 'open-settings':
        browser.runtime.openOptionsPage();
        break;
    }
  };

  /**
   * Adds or removes a command listener for using shortcuts.
   */
  function toggleShortcuts() {
    // Only if supported.
    if (typeof browser.commands !== 'undefined') {
      if (_shortcuts && !browser.commands.onCommand.hasListener(commandListener)) {
        browser.commands.onCommand.addListener(commandListener);
      } else {
        browser.commands.onCommand.removeListener(commandListener);
      }
    }
  }

  function toggleContextMenu() {
    // Only if supported.
    if (typeof browser.menus !== 'undefined') {
      if (_contextMenu) {
        /**
         * Create the page menu item to toggle the JavaScript state.
         */
        browser.menus.create({
          id: 'toggle-js',
          title: 'Toggle JavaScript',
          contexts: ['page']
        });
      } else {
        browser.menus.remove('toggle-js');
      }
    }
  }

  /**
   * Update the extension title and icon when a tab has been updated.
   */
  browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var url = changeInfo.url || tab.url;

    if (!isApplicableUrl(url)) {
      // Don't do anything if this is not an applicable url.
      return;
    }

    if (typeof changeInfo.status === 'undefined' || changeInfo.status !== 'complete') {
      // onUpdated gets fired multiple times on tab change, only listen to the
      // complete state.
      return;
    }

    var host = new URL(url).hostname;

    isJSEnabled(host, tabId).then(function(jsEnabled) {
      if (typeof browser.browserAction.setIcon !== 'undefined') {
        browser.browserAction.setIcon(getIcon(jsEnabled, tabId, url));
      }

      browser.browserAction.setTitle({
        title: (jsEnabled ? 'Disable' : 'Enable') + ' Javascript',
        tabId: tabId
      });

      // Show <noscript> tags if JS is disabled.
      if (!jsEnabled) {
        browser.tabs.executeScript(
          tabId, {
          file: '/background/content.js'
        });
      }
    });
  });

  /**
   * Update the icon when a new tab is being opened.
   */
  browser.tabs.onCreated.addListener(function(tab) {
    var url = tab.url;

    if (url) {
      var host = new URL(url).hostname;

      isJSEnabled(host, tab.id).then(function(jsEnabled) {
        if (typeof browser.browserAction.setIcon !== 'undefined') {
          browser.browserAction.setIcon(getIcon(jsEnabled, tab.id, url));
        }
      });
    }
  });

  /**
   * Update the JS state when the user interacts with the app icon (or the
   * menu item in Firefox for Android).
   * Also updates and reloads the specific tab.
   */
  browser.browserAction.onClicked.addListener(toggleJSState);

  // Only if supported.
  if (typeof browser.menus !== 'undefined') {
    /**
     * Create the browser action menu item to open the settings page.
     */
    browser.menus.create({
      id: 'settings',
      title: browser.i18n.getMessage('menuItemSettings'),
      contexts: ['browser_action']
    });

    /**
     * Create the browser action menu item to open the about page.
     */
    browser.menus.create({
      id: 'about',
      title: 'About Disable JavaScript',
      contexts: ['browser_action']
    });

    /**
     * Open the settings page when the menu item was clicked.
     */
    browser.menus.onClicked.addListener(function(info, tab) {
      switch (info.menuItemId) {
        case 'settings':
          browser.runtime.openOptionsPage();
          break;

        case 'about':
          browser.tabs.create({url: './pages/about.html'});
          break;

        case 'toggle-js':
          toggleJSState(tab);
          break;
      }
    });
  }

  /**
   * Listen to messages from options.js.
   */
  browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
      // Change the default icon if the default state changes.
      case 'default_state':
        _defaultState = request.value;

        if (typeof browser.browserAction.setIcon !== 'undefined') {
          browser.browserAction.setIcon(getIcon(request.value === 'on'));
        }
        break;

      case 'disable_behavior':
        _disableBehavior = request.value;
        break;

      case 'shortcuts':
        _shortcuts = request.value;
        toggleShortcuts();
        break;

      case 'context_menu':
        _contextMenu = request.value;
        toggleContextMenu();
        break;
    }
  });

  /**
   * Handle web extension and browser updates.
   */
  browser.runtime.onInstalled.addListener(function(details) {
    browser.storage.local.get('setting-version').then(handleUpdate);
  });

  // Ensure all needed settings are set.
  preEnsureSettings();
})(browser);
