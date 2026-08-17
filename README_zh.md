<div align="right">
  <a href="README.md">🇬🇧 English</a> | <strong>🇨🇳 简体中文</strong>
</div>

# Transmission Web Control 增强脚本 - 发布说明 (v1.0)

我们非常高兴地发布 **Transmission Web Control 增强脚本 1.0 版本**！此油猴脚本通过增加强大的文件管理、搜索能力和标签处理功能，大幅提升了您使用 Transmission Web Control 的体验。

[![Greasy Fork Version](https://img.shields.io/greasyfork/v/591467-transmission-web-control-enhancement)](https://greasyfork.org/zh-CN/scripts/591467-transmission-web-control-enhancement?locale_override=1)

## ✨ 核心功能

1.  **目录树迁移（保持内部结构）**
    *   **功能说明：** 允许您直接在左侧目录树中，将指定目录下的所有种子数据整体迁移到新的父目录。
    *   **使用方法：** 在左侧面板的任意文件夹节点上（例如 `folders-xxx`）**点击右键**。系统会弹出一个自定义对话框，供您输入新的目标路径。

2.  **搜索增强（支持正则与文件级匹配）**
    *   **功能说明：** 升级了系统默认的搜索框，现在支持正则表达式，并能深入种子内部搜索文件名称。
    *   **使用方法：** 像往常一样在搜索框中输入关键字或正则表达式即可。

3.  **批量标签追加（防覆盖保护）**
    *   **功能说明：** 修复了系统默认在批量修改标签时，会覆盖掉种子原有标签的痛点。
    *   **使用方法：** 选中多个种子并打开设置标签对话框，左下角会自动注入一个“追加模式 (保留原有标签)”的复选框（默认勾选）。

4.  **一键勾选异常种子**
    *   **功能说明：** 瞬间找出并勾选当前页面所有处于异常或警告状态的种子。

## ⚙️ 模块化配置
*   **独立开关：** 核心三大模块（目录迁移、搜索增强、标签追加）均可在油猴脚本菜单中独立开启或关闭。

## ☕ 赞助与支持
如果您觉得这个脚本节省了您的时间，或者单纯想支持一下开发工作，欢迎通过以下方式请作者喝杯咖啡：
*   [**爱发电 (Afdian)**](https://afdian.com/a/aghinouz) | [**Ko-fi**](https://ko-fi.com/aghinouz) | [**Patreon**](https://patreon.com/aghinouz)

---
希望这个脚本能让您的 Transmission 管理更加得心应手！
