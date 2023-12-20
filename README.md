<h1 align="center">
<span align="left" height="30">                  </span>
Missing Commands for Logseq
<a href="https://www.buymeacoffee.com/stdword">
  <img align="right" src="https://github.com/stdword/logseq13-missing-commands/blob/main/assets/coffee.png?raw=true" height="30px"/>
</a>
</h1>

<p align="center">
  <a href="https://github.com/stdword/logseq13-missing-commands#readme">
    <img align="center" width="15%" src="https://github.com/stdword/logseq13-missing-commands/blob/main/icon.png?raw=true"/>
  </a>
</p>


<div align="center">

[![](https://img.shields.io/badge/status-not_ready-ca966c)](https://github.com/stdword/logseq13-missing-commands/releases)
[![Version](https://img.shields.io/github/v/release/stdword/logseq13-missing-commands?color=b3c5d0)](https://github.com/stdword/logseq13-missing-commands/releases)
[![Downloads](https://img.shields.io/github/downloads/stdword/logseq13-missing-commands/total.svg?color=ca966c)](https://github.com/stdword/logseq13-missing-commands#from-logseq-marketplace-recommended-way)

</div>

<p align="center"><i>A part of the <a href="https://logseq.com"><img align="center" width="20px" src="https://github.com/stdword/logseq13-missing-commands/blob/main/assets/logseq.png?raw=true"/></a> <b><a href="https://github.com/search?q=owner%3Astdword+logseq13&type=repositories">Logseq13</a></b> family of plugins</i></p>



## Summary

Missing, but helpful _commands_, _views_ & _features_ for [Logseq](https://logseq.com)

_Designed to be very productive with keyboard_  ❤️



<p> </p>

> ⚠️ Some commands has default shortcut and some not.
> 
> To find out the shortcut for the particular command (or bind your own) use [this](https://github.com/stdword/logseq13-missing-commands/tree/main?tab=readme-ov-file#how-to-change-default-shortcut-for-the-particular-command) instruction.

<p> </p>

> ⚠️ GitHub may need some time to load all demo animations (GIF) in collapsed blocks on this page.

<p> </p>

## 1) Features
TBD

<!--
### TAB-trigger on Search
To fill the input with selected search item. Just press the <kbd>tab</kbd> key to speed up the input values.

<img width="600px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/bf27f3a6-8464-4e1f-b967-e5e9efe46e21"/>

### Fast access to current page name on Search
Helpfull, when you need to access subpages of the current page. Just press the <kbd>←</kbd> arrow key <u>on empty search input</u>.

<img width="600px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/3289dae9-6391-40ed-8198-7e957cd029eb"/>

### Go to block _start_ (_end_) with double-pressing the «Home» («End») key
Just like in Sublime Text editor. MacOS's <kbd>⌘ ←</kbd> / <kbd>⌘ →</kbd> and Windows's <kbd>fn ←</kbd> / <kbd>fn →</kbd> are also supported.

<img width="200px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/4773523a-5900-4b48-b196-f6cb39799548"/>

-->


## 2) Commands: _Blocks reordering_

<table>
<tr><td><details><summary><b>Toggle auto heading</b></summary>
  <p>Without accessing block context menu.</p>
  <p><img width="270px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/9c3295ff-1386-4cbd-a527-4cfd7c37211b"/></p>
</details></td></tr>

<tr><td><details><summary><b>Sort / reverse / shuffle blocks</b></summary>
  <p><b>Note</b>: To sort in descending order use <i>sort</i> and then <i>reverse</i> commands.</p>
  <p><b>Note</b>: <i>Sort</i> and <i>reverse</i> commands available via block context menu. Shuffle command only via **Command Palette**</p>
  <p><img width="230px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/9404b18a-75a4-47bc-a40b-a3869f1ab7a7"/></p>
</details></td></tr>
</table>



## 3) Commands: _Fast navigation_

<table>
<tr><td><details><summary><b>Go to (↑) previous / (↓) next block</b></summary>
  <p>Instantly goes to next / prev block. Even with multiline blocks.</p>
  <p><b>Note</b>: cursor position saves from block to block.</p>
  <p align="center">
    <b>before     &     after</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/d9920377-dc70-423a-a4ac-dd7807221ac6" width=46.5% />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/5933e5f0-6b80-451b-a151-a5f806579356" width=45% />
  </p>
</details></td></tr>

<tr><td><details><summary><b>Go to (↖︎) parent / (↘︎) last child block</b></summary>
  <p>Navigating whole block tree throught diagonal — jumping between the parent and the last child block.</p>
  <p><img width="700px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/e5ae84d3-ff58-4342-ba24-6a02c72ec5a8"/></p>
</details></td></tr>

<tr><td><details><summary><b>Go to |↑| previous / |↓| next sibling block</b></summary>
  <p>Junming between sibling blocks only.</p>
  <p><b>Note</b>: cursor position saves from block to block.</p>
  <p><b>Note</b>: we cannot leave current parent.</p>
  <p><img width="400px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/dc06e983-0aee-4d3d-ae9d-27ebb263c1c5"/></p>
</details></td></tr>
</table>

## 4) Commands: _Blocks movements_

<table>
<tr><td><details><summary><b>Outdent (⇤) children of the block</b></summary>
  <p>Perform outdent (indent to the left) for every child of the particular block</p>
  <p><b>Note</b>: standard Logseq commands <code>⇧⇥</code> can acheive this, but it required to select all child blocks manually one by one before using it.</p>
  <p><img width="200px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/0d6934d9-0098-4870-b96b-685672b09160"/></p>
</details></td></tr>

<tr><td><details><summary><b>Move block (⤒) on top / (⤓) on bottom of siblings</b></summary>
  <p>Instantly makes block the first (or the last) child of the parent</p>
  <p><b>Note</b>: standard Logseq commands <code>⌘⇧↑</code> or <code>⌘⇧↓</code> can acheive this, but it require one step at a time.</p>
  <p><img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/ce70ad72-48c0-4925-8a5e-40fb2d50e2c6" width="250px" /></p>
</details></td></tr>
</table>

## 5) Commands: _Splitting & Joining blocks_

<table>
<tr><td><details><summary><b>Magic Split & Magic Join</b></summary>
  <p>Parse block contents for ordered / unordered lists</p>
  <p><b>Note</b>: supported numeration style: <code>1.</code> <code>1)</code> <code>(1)</code> <code>1.2)</code> for arabic & roman numbers and english alphabet</p>
  <p><b>Note</b>: supported bullets style: <code>-</code> <code>+</code> <code>*</code></p>
  <p align="center">
    <b>Split     &     Join</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/1a06af26-cf38-4262-8cc1-fae645b1a8b8" width=46% />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/c6e56583-b87c-4802-9f29-d36af848b902" width=45% />
  </p>
</details></td></tr>

<tr><td><details><summary><b>Split by lines / Join via new lines</b></summary>
  <p></p>
  
  <p><img width="250px" src="" /></p>
</details></td></tr>

<tr><td><details><summary><b>Split by words / Join by spaces</b></summary>
  <p></p>
  
  <p><img width="250px" src=""/></p>
</details></td></tr>

<tr><td><details><summary><b>Join by commas</b></summary>
  <p></p>
  
  <p><img width="250px" src=""/></p>
</details></td></tr>
</table>


## 6) Views
TBD



## If you ❤️ what I'm doing — consider to support my work
<p align="left">
  <a href="https://www.buymeacoffee.com/stdword" target="_blank">
    <img src="https://github.com/stdword/logseq13-missing-commands/blob/main/assets/coffee.png?raw=true" alt="Buy Me A Coffee" height="60px" />
  </a>
</p>



## Installation
### From Logseq Marketplace (recommended way):
<span>    </span><img width="403px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/3b03345f-0bb8-40ee-8927-3b1efc314b50" />

- Click «...» and open the «Plugins» section (or press `t p`)
- Click on the «Marketplace»
- On the «Plugins» tab search for «Missing Commands & Views» plugin and click install
- If you want to change default shortcuts commands — go to «Keymap» (`g s`)

### Manual way (in case of any troubles with recommended way)
1. *In Logseq*: Enable «Developer mode» in «...» → «Settings» → «Advanced»
2. Download the <u>latest</u> plugin release in a raw .zip archive from [here](https://github.com/stdword/logseq13-missing-commands/releases)
4. Unzip it
5. *In Logseq*: Go to the «...» → «Plugins», click «Load unpacked plugin» and point to the unzipped plugin folder
6. ⚠️ The important point here is: every new plugin release should be updated manually



## FAQ
### How to change default shortcut for the particular command?
1. Open «Settings» → «Keymap» (or press `g s`).
2. Copy this emoji «🪚» (for Windows use «🔪») and insert it to search input.
3. Change any shortcut you want <br/><img width="700px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/b08bd56b-cac3-4531-8b1b-5444852cb602"/>



## Credits
- *Inspiration*:
  - [Another Embed](https://github.com/sethyuan/logseq-plugin-another-embed) by sethyuan
- Icon created by <a href="https://www.flaticon.com/free-icon/hand-saw_10476972" title="Flaticon">Nuricon</a>


## License
[MIT License](https://github.com/stdword/logseq13-missing-commands/blob/main/LICENSE)
