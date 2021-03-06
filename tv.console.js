/**
 * @author Vladimir Reznichenko <kalessil@gmail.com>
 * @date   14.12.2012
 *
 * https://github.com/kalessil/tv.jquery
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 *
 * This script provides simple error console on TV devices
 */
(function ($) {
    var consoleBuffer = [];

    var consoleBufferEntry_toString = function (entry) {
        var strMessage = entry[0];
        var countAppeared = entry[1];

        var strReportAppeared = '';
        if (countAppeared > 1) {
            strReportAppeared = ' [' + countAppeared + ']';
        }

        return '&rsaquo; ' + strMessage + strReportAppeared;
    };


    var consoleBuffer_clear = function () {
        while (consoleBuffer.length > 1) {
            consoleBuffer.pop();
        }
    };
    var consoleBuffer_hasDuplicates = function (strMessage) {
        var isDuplicate;
        var entry;

        for (var position in consoleBuffer) {
            entry = consoleBuffer[position];
            isDuplicate = (entry[0] === strMessage);
            if (isDuplicate) {
                return true;
            }
        }

        return false;
    };
    var consoleBuffer_push = function (strMessage) {
        var newEntry = [strMessage, 1];
        consoleBuffer.push(newEntry);
    };
    var consoleBuffer_popDuplicateUp = function (strMessage) {
        var isDuplicate;
        var entry;

        for (var position in consoleBuffer) {
            entry = consoleBuffer[position];
            isDuplicate = (entry[0] === strMessage);
            if (isDuplicate) {
                var lastEntryPosition = consoleBuffer.length - 1;

                if (lastEntryPosition != position) {
                    var backupLastOne = consoleBuffer[lastEntryPosition];
                    consoleBuffer[lastEntryPosition] = consoleBuffer[position];
                    consoleBuffer[position] = backupLastOne;
                }

                return;
            }
        }
    };
    var consoleBuffer_count = function() {
        return consoleBuffer.length;
    };
    var consoleBuffer_mergeDuplicate = function (strMessage) {
        var isDuplicate;
        var entry;

        for (var position in consoleBuffer) {
            entry = consoleBuffer[position];
            isDuplicate = (entry[0] === strMessage);
            if (isDuplicate) {
                ++consoleBuffer[position][1];
                return;
            }
        }
    };

    var consoleBuffer_registerEntry = function (strMessage) {
        var hasDuplicates = consoleBuffer_hasDuplicates(strMessage);

        if (!hasDuplicates) {
            consoleBuffer_push(strMessage);
            return;
        }

        consoleBuffer_mergeDuplicate(strMessage);
        consoleBuffer_popDuplicateUp(strMessage);
    };

    var consoleObject_create = function () {
        var consoleObject = {
            log:function (strMessage) {
                consoleBuffer_registerEntry(strMessage);
                consoleObject.refresh();
            },
            debug:function (strMessage) {
                consoleBuffer_registerEntry('Debug: ' + strMessage);
                consoleObject.refresh();
            },
            error:function (strMessage) {
                consoleBuffer_registerEntry('<span style="color:#F00">' + strMessage + '</span>');
                consoleObject.refresh();
            },
            info:function (strMessage) {
                consoleBuffer_registerEntry('Info: ' + strMessage);
                consoleObject.refresh();
            },
            warn:function (strMessage) {
                consoleBuffer_registerEntry('<span style="color:#FF7000">' + strMessage + '</span>');
                consoleObject.refresh();
            },
            refresh:function () { },
            clear:function () {
                consoleBuffer_clear();
                consoleObject.refresh();
            }
        };

        return consoleObject;
    };

    var ajaxData_toString = function (event, jqXHR, ajaxSettings){
        var strUrl = ajaxSettings.url;
        var strStatus = jqXHR.statusText;
        var strMethod = ajaxSettings.type;

        var isHttpsOn = (window.location.protocol.toLowerCase() === 'https');
        if(isHttpsOn) {
            var ajaxProtocol = (strUrl.split(':', 1))[0];
            if(ajaxProtocol === 'http') {
                strUrl = strUrl.replace('http://', '<span style="color:#F00">http</span>://');
            }
        }

        strUrl = '<span style="color:#666;text-decoration:underline">' + strUrl + '</span>';
        strStatus = (strStatus ? (' <span style="color:#a6a6a6">' + strStatus + '</span>') : '');
        return strMethod + ' ' + strUrl + strStatus;
    };

    /* attaching listeners */
    window.addEventListener('error', function (event) {
        window.console.error(event.message);
        return true;
    });
    $(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
        var strErrorMessage = ajaxData_toString(event, jqXHR, ajaxSettings);
        window.console.error(strErrorMessage + ' ' + (thrownError ? thrownError : ''));
    });
    $(document).ajaxSuccess(function (event, jqXHR, ajaxSettings) {
        var strLogMessage = ajaxData_toString(event, jqXHR, ajaxSettings);
        window.console.info(strLogMessage);
    });


    var gui_redraw = function () {
        var hasEntries = consoleBuffer_count();
        if (!hasEntries) {
            return;
        }

        gui_writeEntriesDown(consoleBuffer);
    };

    var gui_writeEntriesDown = function(arrEntries) {
        consoleDivNode.innerHTML = '';

        var strEntry;
        var consoleNode = $(consoleDivNode);
        for(var position in arrEntries) {
            strEntry = consoleBufferEntry_toString(arrEntries[position]);
            consoleNode.append(strEntry);
            consoleDivNode.appendChild(lineBreakNode.cloneNode(false));
        }

        consoleDivNode.style.display = 'block';
    };

    var consoleDivNode;
    var gui_createDiv = function () {
        var divNode = document.createElement('div');
        divNode.setAttribute('id', 'tv-console');

        divNode.style.display = 'none';
        divNode.style.position = 'absolute';
        divNode.style.bottom = 0;
        divNode.style.left = 0;
        divNode.style.width = '100%';
        divNode.style.borderTop = 'solid 1px #c6c6c6';
        divNode.style.paddingTop = '7px';
        divNode.style.paddingRight = '7px';
        divNode.style.paddingBottom = '7px';
        divNode.style.paddingLeft = '7px';
        divNode.style.color = '#a6a6a6';
        divNode.style.fontSize = '0.9em';

        document
            .getElementsByTagName('body')[0]
            .appendChild(divNode);
        consoleDivNode = divNode;
    };

    var runPlugin = function () {
        lineBreakNode = document.createElement('br');
        window.console = consoleObject_create();

        var strNativeConsoleStatus = '';
        if(typeof window.console != 'undefined') {
            strNativeConsoleStatus = ' (native one is overridden)';
        }
        consoleBuffer_registerEntry('TV console started' + strNativeConsoleStatus);

        gui_createDiv();
        window.console.refresh = gui_redraw;
        window.console.refresh();
    };

    var lineBreakNode;
    $(document).ready(runPlugin);

})(jQuery);