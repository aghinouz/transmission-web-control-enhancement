// ==UserScript==
// @name         Transmission Web Control Enhancement
// @name:zh-CN   Transmission Web Control 增强
// @icon         data:image/png;base64,AAABAAEAEBAAAAEACABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACApUAAwOUAAUFlgAAAKsAAACtAAAAswAICJYACAiXAAkJmAADA7EACwuWAAwMmwAODpoAEhKdABUVnwA2NC4AOTcxADw6NAA9OzYAPTw2AB8fogBAPjkAIyOkAEREQABHRkAAR0dBAEhJRABISkUASUtIAEZJewBKTXkAU1dVAFRYVgBVWFYAVVlXAFpaVQBWWlgAV1pZAFdbWQBaXFgAWFxZAFhcWgBbXVoAWV1bAFtfXQBbYF0AXmFgAF9jYQBgY2IAQUHgAGBkYgBFReUAZGhmAGVoZgBkaGgAZGhpAGVpZwBmaWcARkbpAGVpaQBFRe0AbW5oAGpubABrbmwAam9rAG1xbwBwcm0AbXJvAHF1cwBydnQAc3d1AHN4dAB2eHMAdHh2AHp/fAB8f34AfIB+AH2CfwB+gn8AfoKAAH6DgAB/g4EAgIOCAH+EgQCCh4QAhomHAIaJiACHiokAh4uJAImNiwCLjowAjZGOAI6SkACPkpAAjZOPAI+TkQCRlJIAlJiWAJaYlwCJic4Al5qYAJebmQCbnZwAnqCfAJyingCbm9UAnZ3WAKetqQCtsq0Ara3cALO6tQC1u7YAtLu4ALW8uQC2vboAvcK9AL7FwQDJz8sAzNLNAM7T0QDP1NIA0tnTANPa1QDV3NcA197ZAOLk5ADk5uYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfyAkJCQkJCQkJCQkJCQifzBKU05QUFBPT09PTU1QUCRFWEEkJCQkJCQkJCQkOVwyV10tdXx8cxhIe3x8eiRkRGdaQ258bxUbFyN2fHQ1ZVZ/T0tobBMcHx8aGXNrSVhmf0lVVEIREh8fFQ89XlFMf38+XEB8fA8gHxB5fEdZRn9/L2EkenwqODgneXssYD5/fyZbQSYrNXFwNCgpP18uf39iIiQkJThycjQhJCQkUn9/f39/f384cnI0f39/f39/f2kUCAcKNnJyNAYHCBZtf38BBAUFCTd4dzQFBQUDDH9/ADM8PDo7fn00PDw8MQt/f2MNAgICHjQ0HQICAg5qf4ABAAAAAAAAAAAAAAAAAAAAAAAAgAAAAIABAACAAQAAgAEAAIABAACAAQAA/D8AAIABAACAAQAAgAEAAIABAAA=
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  It supports directory migration, enhanced search functionality, batch tag appending, and one-click selection of abnormal seeds. These functions can be independently toggled or triggered in the script menu.
// @description:zh-CN 支持目录迁移、搜索增强功能、批量追加标签以及一键勾选异常种子，可在脚本菜单中独立开关功能或触发操作。
// @author       aghinouz & gemini
// @license      GPL-3.0 License
// @match        *://*/transmission/web/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/591467/Transmission%20Web%20Control%20Enhancement.user.js
// @updateURL https://update.greasyfork.org/scripts/591467/Transmission%20Web%20Control%20Enhancement.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 全局配置项 ---
    const CONFIG = {
        dirMove: GM_getValue('enable_dir_move', true),
        searchUpgrade: GM_getValue('enable_search_upgrade', true),
        labelAppend: GM_getValue('enable_label_append', true)
    };

    // 记录菜单ID与修改状态，以便动态更新文字提示
    const menuIds = {};
    const pendingReload = {};

    // --- 1. 动态注册菜单与基础工具 ---
    function renderMenus() {
        // 每次重新绘制前，先注销已存在的菜单，防止重复
        Object.values(menuIds).forEach(id => {
            if (id !== undefined) GM_unregisterMenuCommand(id);
        });

        // 切换配置状态的处理函数
        const toggleConfig = (configKey, storageKey, currentVal) => {
            const newVal = !currentVal;
            GM_setValue(storageKey, newVal);
            CONFIG[configKey] = newVal;          // 更新内存状态
            pendingReload[configKey] = true;     // 标记该项已被修改，等待刷新
            renderMenus();                       // 重新渲染菜单文字
        };

        const menus = [
            { configKey: 'dirMove', storageKey: 'enable_dir_move', title: '目录树迁移（保持结构）' },
            { configKey: 'labelAppend', storageKey: 'enable_label_append', title: '批量标签添加（防覆盖追加）' },
            { configKey: 'searchUpgrade', storageKey: 'enable_search_upgrade', title: '搜索增强（支持正则与文件匹配）' }
        ];

        // 动态生成菜单项
        menus.forEach(m => {
            const isEnabled = CONFIG[m.configKey];
            const prefix = isEnabled ? '✅' : '❌';
            const suffix = pendingReload[m.configKey] ? ' 🔄(请刷新页面生效)' : '';
            const fullTitle = `${prefix} ${m.title}${suffix}`;

            menuIds[m.configKey] = GM_registerMenuCommand(fullTitle, () => toggleConfig(m.configKey, m.storageKey, isEnabled));
        });

        // 独立功能按钮不受状态影响
        menuIds['checkError'] = GM_registerMenuCommand("⚠️ 勾选当前页异常种子", checkErrorTorrents);
    }

    // [独立功能] 一键勾选异常种子（立即执行，高优先度）
    function checkErrorTorrents() {
        const win = unsafeWindow;
        if (!win?.system?.control?.torrentlist || !win.$) {
            return alert("Transmission Web Control 尚未完全加载，请稍后再试。");
        }

        const $ = win.$;
        const datagrid = win.system.control.torrentlist;

        // 编译正则以显著提升多行匹配性能
        const keywords = ['exist', 'registered', '删除', '发布', '上传', '种子', 'passkey', 'require', 'trump'];
        const keywordRegex = new RegExp(keywords.join('|'), 'i');

        const rows = datagrid.datagrid('getRows') || [];
        let hasError = false;

        // 避免重复勾选产生冲突，先清空选中状态 (可选)
        datagrid.datagrid('uncheckAll');

        rows.forEach((row, index) => {
            const errorMsg = `${row.errorString || ''} ${row.warning || ''}`;
            if (keywordRegex.test(errorMsg)) {
                datagrid.datagrid('checkRow', index);
                hasError = true;
            }
        });

        const msg = hasError ? '已自动勾选所有异常种子。' : '当前页没有找到异常种子。';
        $.messager.show({ title: '提示', msg, timeout: 3000, showType: 'slide' });
    }

    // --- 2. 轮询等待系统核心挂载 ---
    function initEnhancements() {
        // 如果后台功能全关，则停止后续无意义的轮询
        if (!CONFIG.dirMove && !CONFIG.searchUpgrade && !CONFIG.labelAppend) return;

        const initTimer = setInterval(() => {
            const win = unsafeWindow;
            // 校验核心依赖是否完全注入到全局
            if (win?.system?.panel?.left && win.$ && win.transmission?.torrents && win.system.searchTorrents && win.system.openDialogFromTemplate) {
                clearInterval(initTimer);
                bootstrapModules(win);
            }
        }, 500);
    }

    // --- 3. 模块初始化入口 ---
    function bootstrapModules(win) {
        const { $, system, transmission } = win;

        if (CONFIG.dirMove) initDirMoveModule($, system, transmission);
        if (CONFIG.searchUpgrade) initSearchUpgradeModule($, system, transmission);
        if (CONFIG.labelAppend) initLabelAppendModule($, system, win.document);
    }

    // ==========================================
    // 模块 A：目录迁移功能
    // ==========================================
    function initDirMoveModule($, system, transmission) {
        console.log("Transmission 目录迁移模块已加载。");

        // 使用原生监听器，且第三个参数为 true（开启捕获阶段）
        // 这样能在 EasyUI 截断事件之前，率先抢夺右键控制权！
        document.addEventListener('contextmenu', function (e) {
            // 向上寻找最近的 .tree-node 元素
            const treeNode = e.target.closest('.tree-node');

            // 确认找到的节点属于左侧目录树 #m_left
            if (treeNode && $('#m_left').has(treeNode).length > 0) {
                // console.log("[TWC增强] ⚡ 捕获阶段成功拦截树节点右键:", treeNode);

                const node = $('#m_left').tree('getNode', treeNode);
                // console.log("[TWC增强] 📦 提取到的节点数据:", node);

                if (!node) return;

                // 检查是否是我们需要处理的真实目录节点
                if (node.id && node.id.startsWith('folders-') && node.downDir) {
                    // console.log("[TWC增强] ✅ 条件满足，强制接管右键菜单！");

                    // 阻止浏览器默认右键菜单
                    e.preventDefault();
                    // 核心：阻止事件继续向下传递给 EasyUI，防止它弹出原生的其他菜单或报错
                    e.stopPropagation();

                    // 选中该节点并弹出我们的迁移窗口
                    $('#m_left').tree('select', node.target);
                    showMoveDialog(node);
                } else {
                    // console.log("[TWC增强] ⏭️ 非目标目录，放行事件给系统原生处理");
                }
            }
        }, true); // <-- 这个 true 就是降维打击的核心

        // 核心算法：通过递归深度提取真实的目录路径
        function getRealFolderPath(node) {
            let depth = 0;
            let curr = node;
            const tree = $('#m_left');

            while (curr && curr.id !== 'folders' && curr.id.startsWith('folders-')) {
                depth++;
                curr = tree.tree('getParent', curr.target);
            }

            if (depth === 0 || !node.downDir) return node.downDir;

            const isWindows = node.downDir.includes('\\');
            const sep = isWindows ? '\\' : '/';
            // 统一路径分隔符并拆分，清理掉空白项以防止结构偏移
            const parts = node.downDir.replace(/\\/g, '/').split('/');

            const prefixParts = [];
            let validCount = 0;

            for (const part of parts) {
                prefixParts.push(part);
                if (part !== "") {
                    validCount++;
                    if (validCount === depth) break;
                }
            }

            let realPath = prefixParts.join(sep);
            if (isWindows && realPath.endsWith(':')) realPath += '\\'; // 修复如 C: 的情况
            else if (realPath === '') realPath = '/';

            return realPath;
        }

        function showMoveDialog(node) {
            const oldDir = getRealFolderPath(node);
            if (!oldDir) return;

            const dialogId = 'dialog-move-folder';
            if (!$('#' + dialogId).length) {
                $('body').append(`
                    <div id="${dialogId}" style="padding:20px; display:none;">
                        <div style="margin-bottom:15px;">
                            Current Path: <span id="move-old-path" style="word-break: break-all; color:#e0e0e0;"></span>
                        </div>
                        <div>
                            New Path: <input id="move-new-path" class="easyui-textbox" style="width:100%;" />
                        </div>
                        <div style="margin-top: 10px; font-size: 12px;">
                            * This will perform "move from previous location" for all torrents inside this folder and its subfolders.
                        </div>
                    </div>
                `);
            }

            $('#move-old-path').text(oldDir);

            $('#' + dialogId).show().dialog({
                title: system.lang.dialog['torrent-changeDownloadDir'].title || 'Move Folder Location',
                width: 550, height: 250, closed: false, cache: false, modal: true,
                buttons: [{
                    text: system.lang.public['text-ok'] || 'OK',
                    iconCls: 'iconfont icon-ok',
                    handler: function () {
                        const newDir = $('#move-new-path').val().trim();
                        if (newDir && newDir !== oldDir) {
                            $('#' + dialogId).dialog('close');
                            executeMove(oldDir, newDir);
                        } else if (newDir === oldDir) {
                            $.messager.alert('Warning', 'The new path is the same as the old path.', 'warning');
                        }
                    }
                }, {
                    text: system.lang.public['text-cancel'] || 'Cancel',
                    iconCls: 'iconfont icon-cancel',
                    handler: () => $('#' + dialogId).dialog('close')
                }],
                onOpen: function () {
                    const targetInput = $('#move-new-path');
                    targetInput.hasClass('textbox-f') ? targetInput.textbox('setValue', oldDir) : targetInput.textbox({ value: oldDir });
                }
            });
        }

        function executeMove(oldPrefix, newPrefix) {
            const moves = {}; // 格式 { "dest_path": [torrentIds...] }
            const slash = oldPrefix.includes('\\') ? '\\' : '/';

            const oldPrefixFixed = oldPrefix.endsWith(slash) ? oldPrefix : oldPrefix + slash;
            const oldPrefixNoSlash = oldPrefix.endsWith(slash) ? oldPrefix.slice(0, -1) : oldPrefix;
            const newPrefixFixed = newPrefix.endsWith(slash) ? newPrefix : newPrefix + slash;

            // 遍历并分类
            Object.values(transmission.torrents.all).forEach(t => {
                if (!t?.downloadDir) return;

                const dDir = t.downloadDir;
                let newDest = null;

                if (dDir === oldPrefixNoSlash || dDir === oldPrefixFixed) {
                    newDest = newPrefix;
                } else if (dDir.startsWith(oldPrefixFixed)) {
                    newDest = newPrefixFixed + dDir.substring(oldPrefixFixed.length);
                }

                if (newDest) {
                    moves[newDest] = moves[newDest] || [];
                    moves[newDest].push(t.id);
                }
            });

            const moveDirs = Object.keys(moves);
            if (!moveDirs.length) {
                return $.messager.alert('Info', 'No torrents found in this folder.', 'info');
            }

            $.messager.progress({ title: 'Moving Torrents', msg: 'Moving data and updating transmission... Please wait.' });

            let completed = 0;
            let successCount = 0;

            // 批量触发 RPC
            moveDirs.forEach(dest => {
                transmission.exec({
                    method: "torrent-set-location",
                    arguments: { ids: moves[dest], location: dest, move: true }
                }, data => {
                    completed++;
                    if (data?.result === 'success') successCount += moves[dest].length;

                    if (completed === moveDirs.length) {
                        $.messager.progress('close');
                        $.messager.show({ title: 'Complete', msg: `Successfully initiated move for ${successCount} torrent(s).`, timeout: 3000, showType: 'slide' });
                        setTimeout(() => system.reloadData(), 1500); // 给传输核心缓冲时间后刷新 UI
                    }
                });
            });
        }
    }

    // ==========================================
    // 模块 B：搜索增强功能（文件/正则匹配）
    // ==========================================
    function initSearchUpgradeModule($, system, transmission) {
        console.log("Transmission 搜索增强模块已加载。");

        // 预加载所有文件列表到内存，供后续无感秒查
        transmission.exec({
            method: "torrent-get",
            arguments: { fields: ["id", "files"] }
        }, res => {
            if (res?.result === "success") {
                res.arguments.torrents.forEach(t => {
                    if (transmission.torrents.all[t.id]) transmission.torrents.all[t.id].files = t.files;
                });
            }
        });

        // 拦截系统原生搜索
        system.searchTorrents = function (key) {
            if (!key?.trim()) return system.removeTreeNode("search-result");

            const allTorrents = Object.values(transmission.torrents.all);
            const missingIds = allTorrents.filter(t => t && !t.files).map(t => t.id);

            // 增量补齐缺失的文件缓存（通常只在新增种子时触发）
            if (missingIds.length > 0) {
                transmission.exec({
                    method: "torrent-get",
                    arguments: { ids: missingIds, fields: ["id", "files"] }
                }, res => {
                    if (res?.result === "success") {
                        res.arguments.torrents.forEach(t => {
                            if (transmission.torrents.all[t.id]) transmission.torrents.all[t.id].files = t.files;
                        });
                    }
                    executeMemorySearch(key, allTorrents);
                });
            } else {
                executeMemorySearch(key, allTorrents);
            }
        };

        function executeMemorySearch(key, torrents) {
            let regex;
            try {
                regex = new RegExp(key, 'i');
            } catch (e) {
                regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // 回退至普通转义字符串
            }

            // 极速内存过滤
            const result = torrents.filter(t => {
                if (!t) return false;
                if (regex.test(t.name)) return true;
                return t.files && t.files.some(f => regex.test(f.name));
            });

            transmission.torrents.searchResult = result;

            // 镜像刷新 UI Tree
            if (result.length > 0) {
                let node = system.panel.left.tree("find", "search-result");
                const text = `${system.lang.tree["search-result"]} : ${key} (${result.length})`;

                if (!node) {
                    system.appendTreeNode("torrent-all", [{
                        id: "search-result", text: text, iconCls: "iconfont tr-icon-search"
                    }]);
                    node = system.panel.left.tree("find", "search-result");
                } else {
                    system.panel.left.tree("update", { target: node.target, text });
                }
                system.panel.left.tree("select", node.target);
            } else {
                system.removeTreeNode("search-result");
            }
        }
    }

    // ==========================================
    // 模块 C：批量标签防覆盖追加功能
    // ==========================================
    function initLabelAppendModule($, system, domBody) {
        console.log("Transmission 批量标签追加修复模块已加载。");

        let isAppendMode = false;
        let originalLabelsBackup = {};
        system.config.labelMaps = system.config.labelMaps || {};

        // 底层数据劫持：保证写入时的逻辑
        system.config.labelMaps = new Proxy(system.config.labelMaps, {
            set(target, property, value) {
                // hash长度校验
                if (typeof property === 'string' && property.length === 40) {
                    const oldLabels = originalLabelsBackup[property];
                    if (isAppendMode && oldLabels) {
                        target[property] = Array.from(new Set([...oldLabels, ...(value || [])]));
                        return true;
                    }
                }
                target[property] = value;
                return true;
            },
            deleteProperty(target, property) {
                if (typeof property === 'string' && property.length === 40) {
                    const oldLabels = originalLabelsBackup[property];
                    // 在追加模式下删除等同于保持原有标签
                    if (isAppendMode && oldLabels?.length > 0) {
                        target[property] = oldLabels;
                        return true;
                    }
                }
                delete target[property];
                return true;
            }
        });

        // 拦截对话框创建 API
        const origOpenDialog = system.openDialogFromTemplate;
        system.openDialogFromTemplate = function (config) {
            const ret = origOpenDialog.apply(this, arguments);

            if (config?.id === "dialog-torrent-setLabels") {
                const hashs = config.datas?.hashs || [];
                const isBulk = hashs.length > 1;

                // 备份当前操作对象的历史标签集
                originalLabelsBackup = {};
                hashs.forEach(hash => {
                    originalLabelsBackup[hash] = [...(system.config.labelMaps[hash] || [])];
                });

                // 多选模式下默认开启追加机制
                isAppendMode = isBulk;

                if (isBulk) injectCheckboxInstant(domBody);
            }
            return ret;
        };

        // UI 注入：等待 EasyUI 解析完成并挂载 Checkbox
        function injectCheckboxInstant(body) {
            const dialogId = "dialog-torrent-setLabels";

            const doInject = ($dialogBody) => {
                $dialogBody.css('position', 'relative');
                const checkboxHtml = `
                    <div style="position: absolute; bottom: 12px; left: 15px; z-index: 9999;">
                        <label style="cursor: pointer;" title="勾选：保留原标签并合并新标签\n取消：清除原标签并完全覆盖">
                            <input type="checkbox" id="bulk-label-append-mode" checked style="vertical-align: middle; margin-top: -2px;">
                            追加模式 (保留原有标签)
                        </label>
                    </div>`;

                $dialogBody.append(checkboxHtml);

                $('#bulk-label-append-mode').on('change', function () {
                    isAppendMode = $(this).is(':checked');
                });
            };

            const $dlg = $("#" + dialogId);
            // 尝试直接挂载
            if ($dlg.length && $dlg.html().length > 10 && !$('#bulk-label-append-mode').length) {
                doInject($dlg);
                return;
            }

            // 备用方案：模板如果为异步加载，使用 MutationObserver 监听
            const observer = new MutationObserver((mutations, obs) => {
                const $d = $("#" + dialogId);
                if ($d.length && $d.html().length > 10 && !$('#bulk-label-append-mode').length) {
                    doInject($d);
                    obs.disconnect(); // 挂载成功后立即销毁监听提升性能
                }
            });

            observer.observe(body, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 5000); // 5秒兜底防止内存泄漏
        }
    }

    // --- 启动脚本 ---
    renderMenus(); // 换成新的渲染模式
    initEnhancements();

})();
