<h1 align="center">
<span align="left" height="30">                  </span>
Missing Commands, Views & Features
<a href="https://www.buymeacoffee.com/stdword">
  <img align="right" src=" https://github.com/stdword/logseq13-missing-commands/blob/main/assets/coffee.png?raw=true" height="30px"/>
</a>
</h1>

<p align="center">
  <a href="https://github.com/stdword/logseq13-missing-commands#readme">
    <img align="center" width="15%" src="https://github.com/stdword/logseq13-missing-commands/blob/main/icon.png?raw=true"/>
  </a>
</p>


<div align="center">

[![](https://img.shields.io/badge/status-in_development-ca966c)](https://github.com/stdword/logseq13-missing-commands/releases)
[![Version](https://img.shields.io/github/v/release/stdword/logseq13-missing-commands?color=b3c5d0)](https://github.com/stdword/logseq13-missing-commands/releases)
[![Downloads](https://img.shields.io/github/downloads/stdword/logseq13-missing-commands/total.svg?color=ca966c)](https://github.com/stdword/logseq13-missing-commands#from-logseq-marketplace-recommended-way)

</div>

<p align="center"><i>A part of the <a href="https://logseq.com"><img align="center" width="20px" src="https://github.com/stdword/logseq13-missing-commands/blob/main/assets/logseq.png?raw=true"/></a> <b><a href="https://github.com/search?q=owner%3Astdword+logseq13&type=repositories">Logseq13</a></b> family of plugins</i></p>



## Summary

Missing, but helpful _commands_, _views_ & _features_ for [Logseq](https://logseq.com)

_Designed to be very productive with keyboard_  ❤️

<p> </p>

> ℹ️ Some commands has default shortcut and some not.
> 
> To find out the shortcut for the particular command (or bind your own) use [this](https://github.com/stdword/logseq13-missing-commands/tree/main?tab=readme-ov-file#how-to-change-default-shortcut-for-the-particular-command) instruction.
>
> Any command could be called from <i>Commands Palette</i>

<p> </p>

> ❗️ Some parts of this plugin heavily rely on Logseq's Document Object Model (DOM) structure. This means that every Logseq update could potentially break specific plugin functions. If you notice anything unusual, please create an issue with details.

<p> </p>

> ⚠️ GitHub may need some time to load all demo animations (GIF) in collapsed blocks on this page.

<p> </p>

## 1) Features

<table>
<tr><td><details><summary><b>TAB-trigger on Search</b></summary>
  <p>To fill the input with selected search item. Just press the <code>tab</code> key to speed up the input values.</p>
  <p><img width="600px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/bf27f3a6-8464-4e1f-b967-e5e9efe46e21"/></p>
</details></td></tr>

<tr><td><details><summary><b>Fast access to current page name on Search</b></summary>
  <p>Helpfull, when you need to access subpages of the current page. Just press the <code>←</code> arrow key <u>on empty search input</u>.</p>
  <p><img width="600px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/a083c0c1-604a-4514-8732-41b6a8c7b1ba"/></p>
</details></td></tr>


<tr><td><details><summary><b>Go to the block <i>start</i> (<i>end</i>) with double-pressing the «Home» («End») key</b></summary>
  <p>Just like in Sublime Text editor. MacOS's <code>⌘ ←</code> / <code>⌘ →</code> and Windows's <code>fn ←</code> / <code>fn →</code> are also supported.</p>
  <p><b>Restriction</b>: This feature only works for natural lines of block, which have a «new line» character or «\n». It does not work with lines created due to the size of the layout. In such cases, the only way to proceed is to press <code>Esc</code> to exit edit mode and then use the <code>←</code> or <code>→</code> arrow key to re-enter it.</p>
  <p><img width="200px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/4773523a-5900-4b48-b196-f6cb39799548"/></p>
</details></td></tr>

<tr><td><details><summary><b>Spare space between 1-level blocks</b></summary>
  <p>Increase the space between 1-level blocks in order to <u>clearly separate</u> them from each other.</p>
  <p><b>Motivation</b>: blocks on the first level represent the most general parts of the information, which usually stand separately: headings, categories, clients, code snippets, links, etc.</p>
  <p><img width="300px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/7a3ab5be-8f97-4538-9cc5-5af2d76d4b31"/></p>
</details></td></tr>
</table>

## 2) Commands: _Blocks reordering_

<table>
<tr><td><details><summary><b>Toggle auto heading</b></summary>
  <p>Without accessing block context menu.</p>
  <p><img width="270px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/9c3295ff-1386-4cbd-a527-4cfd7c37211b"/></p>
</details></td></tr>

<tr><td><details><summary><b>Sort / reverse / shuffle blocks</b></summary>
  <p><b>Note</b>: To sort in descending order use <i>sort</i> and then <i>reverse</i> commands.</p>
  <p><b>Note</b>: <i>Sort</i> and <i>reverse</i> commands available via block context menu. Shuffle command only via <b>Command Palette</b></p>
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
  <p>Jumping between sibling blocks only.</p>
  <p><b>Note</b>: cursor position saves from block to block.</p>
  <p><b>Note</b>: we cannot leave current parent.</p>
  <p><b>Note</b>: the difference from prevous command is skipping all child blocks.</p>
  <p><img width="400px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/dc06e983-0aee-4d3d-ae9d-27ebb263c1c5"/></p>
</details></td></tr>
</table>

## 4) Commands: _Blocks movements_

<table>
<tr><td><details><summary><b>Outdent (⇤) children of the block</b></summary>
  <p>Perform outdent (indent to the left) for every child of the particular block.</p>
  <p><b>Note</b>: standard Logseq commands <code>⇧⇥</code> can acheive this, but it required to select all child blocks manually one by one before using it.</p>
  <p><img width="200px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/0d6934d9-0098-4870-b96b-685672b09160"/></p>
</details></td></tr>

<tr><td><details><summary><b>Move block (⤒) on top / (⤓) on bottom of siblings</b></summary>
  <p>Instantly makes block the first (or the last) child of the parent.</p>
  <p><b>Note</b>: standard Logseq commands <code>⌘⇧↑</code> or <code>⌘⇧↓</code> can acheive this, but via one step at a time.</p>
  <p><img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/ce70ad72-48c0-4925-8a5e-40fb2d50e2c6" width="200px" /></p>
</details></td></tr>
</table>

## 5) Commands: _Splitting & Joining blocks_

<table>
<tr><td><details><summary><b>Magic Split & Magic Join</b></summary>
  <p>Search block content for ordered / unordered lists and split it to corresponding blocks structure.</p>
  <p><b>Note</b>: supported numeration style: <code>1.</code> <code>1)</code> <code>(1)</code> <code>1.2)</code> for arabic & roman numbers and letters from alphabet.</p>
  <p><b>Note</b>: supported bullets style: <code>-</code> <code>+</code> <code>*</code>.</p>
  <p align="center">
    <b>Split     &     Join</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/1a06af26-cf38-4262-8cc1-fae645b1a8b8" width=46% />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/c6e56583-b87c-4802-9f29-d36af848b902" width=45% />
  </p>
</details></td></tr>

<tr><td><details><summary><b>Split by lines / Join via new lines</b></summary>
  <p>Simple command to pick out each line of block to separate block (and vica-versa).</p>
  <p><b>Note</b>: There are two types of join command: with respect to block structure and without it.</p>
  <p align="center">
    <b>Split     &                     Join</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/6b50341e-7457-4044-bd65-efb77eff3fa7" width=42% />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/b935872f-9527-4b2b-89a7-5b8cdb9006e9" width=49% />
  </p>
</details></td></tr>

<tr><td><details><summary><b>Split by words / Join via spaces</b></summary>
  <p>Get all words from the text and place it at the separate blocks (and vice-versa).</p>
  <p><b>Note</b>: Words could contain letters, <code>'</code>, <code>_</code> & <code>-</code> characters.</p>
  <p align="center">
    <b>Split     &                     Join</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/6a61a73d-cbbf-45c3-baa4-cfea10c315a0" width=42.5% />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/2493f70c-94c7-4914-a24d-8550784f4294" width=47.5% />
  </p>
</details></td></tr>

<tr><td><details><summary><b>Split comma-separated words / Join via commas</b></summary>
  <p>Get all words from the comma-separated text and place it at the separate blocks (and vice-versa).</p>
  <p><b>Note</b>: Use previous <i>Split by words</i> command to split.</p>
  <p><b>Note</b>: Joinig respects the root node with colon «:».</p>
  <p><img width="450px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/6ee64586-7ecd-4a61-bc82-b60b2756af97" /></p>
  <p><img width="450px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/1fb4f3ab-31f4-40ff-a617-ea8f74fb7567" /></p>
</details></td></tr>

<tr><td><details><summary><b>Split / Join sentences</b></summary>
  <p>Split paragraph of text by sentences (one block = one sentence). And join the blocks to single paragraph.</p>
  <p><b>Note</b>: Split removes the dots at the end. Join returns the dots back.</p>
  <p align="center">
    <b>Split     &     Join</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/306b0e6a-38de-43af-a72c-8292660e46fb" width=45% />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/8fcfa94a-eefb-4197-a8dd-60e0b679f258" width=45% />
  </p>
</details></td></tr>
</table>


## 6) Commands: _Updating blocks_

<table>
<tr><td><details><summary><b>Remove new lines</b></summary>
  <p>Remove all «new line» characters from text. Helpful for work with OCR texts.</p>
  <p><b>Note</b>: command adds spaces when it's necessary.</p>
  <p><img width="400px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/770ae2d1-1cc7-4c27-9054-45849ddd4127"/></p>
</details></td></tr>

<tr><td><details><summary><b>Lower / upper / title letters case</b></summary>
  <p><b>Note</b>: title case command has two variations — title <i>words</i> and title <i>sentences</i>.</p>
  <p><img width="350px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/f4775d48-1a24-49ce-994a-857bd5471c70"/></p>
</details></td></tr>
</table>


## 7) Views

<table>
<tr><td><details><summary><b>Hide references started with «.»</b></summary>
  <p>Hide any page and tag references that start with the dot: «.», assuming that these are special reserved references that do not need to be shown.</p>
  <p><b>Note</b>: there are two ways of hiding:</p>
  <p align="center">
    <b>Hide by wrapping to «…» only                     &   Hide completely and show on block hover</b> <br>
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/e93f9d52-bdd4-4983-a674-1fd42956193e" width="250px" />
    <img src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/7c163104-51f4-4bbf-b8fd-8abf734c59a9" width="260px" />
  </p>
</details></td></tr>

<tr><td><details><summary><b>Tabular view</b></summary>
  <p>Use the <code>#.tabular</code> reference in a block to apply a Tana-like tabular view for all its children.<br/>
  <b>Note</b>: it could be subsequent — <code>#.tabular</code> inside another <code>#.tabular</code>. However, only two subsequent levels are supported.</p>
  <p>Use the <code>#.tabular0</code> reference in another tabular row to skip the immediate children.<br/>
  <b>Note</b>: The <code>#.tabular0</code> reference always needs to be subsequent.</p>
  <p><img width="550px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/81253770-b02f-4b31-9b5c-af9dd031cad0"/></p>
  <p><img width="550px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/37b0d07d-1ef3-480d-9ab0-5c6258363f45"/></p>
  <p><img width="550px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/d25aae8f-37a1-4619-ad63-fcdf799687c3"/></p>
</details></td></tr>
</table>



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

### Why I cannot revert the result of particular command with one _Undo_ action?
This is a restriction of the Logseq API: there is no way to execute complex commands in a single _Undo_. Therefore, the plugin attempts (when it makes sense) to minimize the count of _Undo_ actions by removing the entire block tree instead of removing each block independently.

### Why there is strange «ø» charactear appears sometimes during _Undo_ command?
<p><img width="200px" src="https://github.com/stdword/logseq13-missing-commands/assets/1984175/74c428b4-7680-4b3b-bff1-3d32c9357898"/></p>

The reason is [this](https://github.com/logseq/logseq/issues/10729) bug in Logseq plugin API. The plugin uses «ø» character intentionally as a workaround for this issue. When the bug is resolved, this workaround will no longer be necessary.



## Additional helpful plugins
- [Shallow Copy](https://github.com/MateuszMyalski/logseq-plugin-shallow-copy) by `MateuszMyalski`
- [Side Block](https://github.com/YU000jp/logseq-plugin-side-block) by `YU000jp`
- [Custom Files](https://github.com/cannibalox/logseq-custom-files) by `cannibalox`



## Credits
- Auto heading & table resizer based on [Another Embed](https://github.com/sethyuan/logseq-plugin-another-embed) by `sethyuan`
- Tabular view based on _«Tabular Journals»_ by `nmartin84` (there is no such repo anymore)
- Table resizer based on [Custom Files](https://github.com/cannibalox/logseq-custom-files) by `cannibalox`
- Some views based on [LogTools](https://github.com/cannibalox/logtools) by `cannibalox`
- Icon created by <a href="https://www.flaticon.com/free-icon/hand-saw_10476972" title="Flaticon">Nuricon</a>



## License
[MIT License](https://github.com/stdword/logseq13-missing-commands/blob/main/LICENSE)
