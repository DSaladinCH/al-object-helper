<div align="center">
  <a href="./Images/ALObjectHelper_Small.png">
    <img src="./Images/ALObjectHelper_Small.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">AL Object Helper</h3>

  <p align="center">
    Quick and easy access to any al object in your project
    <br />
<div>

[![GitHub issues](https://img.shields.io/github/issues/DSaladinCH/al-object-helper?style=for-the-badge)](https://github.com/DSaladinCH/al-object-helper/issues)
[![GitHub license](https://img.shields.io/github/license/DSaladinCH/al-object-helper?style=for-the-badge)](https://github.com/DSaladinCH/al-object-helper/blob/master/LICENSE.txt)
[![VS Code Version (DSaladin.al-object-helper)](https://img.shields.io/visual-studio-marketplace/v/DSaladin.al-object-helper?label=VS%20Code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=DSaladin.al-object-helper)  

</div>
    <a href="https://marketplace.visualstudio.com/items?itemName=DSaladin.al-object-helper">Download</a>
    ·
    <a href="https://github.com/DSaladinCH/al-object-helper/issues/new/choose">Report Bug / Request Feature</a>
  </p>
</div>

# About this project
With this package you can quickly open all your local and app al files. Use shortcuts to open files even faster (for example `t18` to open the customer table or `p5050` to open the contact card). <br />
It supports a better event search than the integrated one and let you search for an event subscriber.

In a app al file, it is possible to view definitions and hover over them. <br />
This functionality may still contain errors. Possibly there are also definitions which have not yet been implemented. Please report those on the issue page.

# Features and Commands
## Open and search al objects
With the command **Open AL Object** (<kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>O</kbd>) you can easly open any al object.
You can use shortcuts to quickly open a object (More about this in [Object Shortcuts](#object-shortcuts)).
It is also possible to search only in one specific app with the command **Open AL Object of App**.

## Local and app package al objects
Both local and app package files are supported. All app packages will be detected and read when opening the workspace and can be manually detected with the command **Reload Objects**.

## Copy events
The improved **Copy Event** command (<kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>E</kbd>) uses a object grouped search and provides the events faster than the integrated one. Go to [Important Infos](#important-infos) to learn how to use the improved search.

## Local event subscribers
If you are searching for a event you already subscribed to, you can use the command **Jump to local Event Subscriber** to quickly search through all your local files and jump right to the subscriber.

## Object Extensions
If you are in a extension object (for example a table extension) you can navigate to the parent object by running the command **Open extended Object**. In, for example, a table you can view all objects which extended this table by running the command **Show Extensions**.

# Planned features
* Automatically research when changing branch
* AL Object List

# Object Shortcuts
To quickly open any object you can use a object shortcut. \
Just run the command **Open AL Object** and use the type shortcut and the object id as follow:
| Shortcut | Description                                     |
|----------|-------------------------------------------------|
|  T       | Open a table                                    |
|  TE      | Open a table extension by the parent table id   |
|  TED     | Open a table extension                          |
|  P       | Open a page                                     |
|  PE      | Open a page extension by the parent page id     |
|  PED     | Open a page extension                           |
|  E       | Open a enum                                     |
|  EE      | Open a enum extension by the parent enum id     |
|  EED     | Open a enum extension                           |
|  R       | Open a report                                   |
|  RE      | Open a report extension by the parent report id |
|  RED     | Open a report extension                         |
|  C       | Open a codeunit                                 |
|  X       | Open a xmlport                                  |
|  Q       | Open a query                                    |

# Examples
**Ex. T27 for Item Table**
<br />
![Ex. T27 for Item Table](Images/vid01.gif)

**Ex. P21 for Customer Page**
<br />
![Ex. P21 for Customer Page](Images/vid02.gif)

# Important Infos
If you use the latest version of the AL Language Extension by Microsoft, you have to remove the "AL: Find Event" keybinding to use the integrated search. <br />
![Remove the "AL: Find Event" keybinding](Images/vid03.gif)

With the latest version it is possible to jump to definition within an AL file.
This is a new feature and may still contain errors. Possibly there are also definitions which have not yet been implemented.
Please report these in the Git Repository.

# Requirements
* [AL Language](https://marketplace.visualstudio.com/items?itemName=ms-dynamics-smb.al)

# Commands
* **Open AL Object**: Search for any object (Shortcut: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>O</kbd>)
* **Open AL Object of App**: Search for any object in a specific app
* **Copy Event**: Search and copy any event of a object (Shortcut: <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>E</kbd>)
* **Jump to local Event Subscriber**: Search for a local event subscriber and jump right to it
* **Open extended Object**: Open the extended object of the current object
* **Show Extensions**: Show all extensions for the current object
* **Reload Objects**: Reload and reread all al objects

# Known Issues
- Reloading of objects causes perfomance issues

# Release Notes
## 2.1.4
- Changed minimum VS Code version to 1.60.0

## 2.1.3
- Added option to only load symbol files
- Added option to only show local files when running the command "Open AL Object"
- Fixed reload command to recreate the reader class

## 2.1.2
- Added option to suppress the auto reload
- Added reload command
- Shortened the vsix file

## 2.1.1
- Reverted reloading of objects because of performance issues

## 2.1.0
- Fixed a event subscriber bug with array parameters
- Added a reload when opening the al object helper searchbar

## 2.0.0
- Completely reworked extension and converted it to TypeScript
- Faster reading
- Better performance

## 1.6.3
- Added workspace support
- Fixed some bugs with BC 14

## 1.6.2
- Fixed some Hover bugs
- Fixed some Definition bugs

## 1.6.1
- Improved performance on unzipping App Files
- Fixed some Bugs on EventPublishers and Definition Provider 

## 1.6.0
- Improved performance on unzipping App Files

## 1.5.9
- Fixed some Bugs on EventPublishers and Definition Provider

## 1.5.8
- Added new functionallity to open the extended Object from an extension Object
- Changed BC14 Symbols File Names

## 1.5.7
- Added BC14 Symbols Support

## 1.5.6
- Fixed hovering in AL Files

## 1.5.5
- Improved Performance on reading Files

## 1.5.4
- Fixed Event search problem

## 1.5.3
- Fixed Bugs

## 1.5.2
- Added Definition for Rec and xRec
- Fixed Bugs

## 1.5.1
- Huge Performance Improvement

## 1.5.0
- Added Definition Provider for all AL Files
- Added Hover Provider for all AL Files

## 1.4.1
- Added Setting for the extracted AL Files
- Changed logo

## 1.4.0
- Added feature to copy any Event Publisher
- Added feature to search any local Event Subscriber and jump to it

## 1.3.6
- Improved App File reading speed
- Fixed local search

## 1.3.5
- Added a Progressbar while reading the objects
- Added a new Command for rereading local Files
- Fixed Regeneration Problems

## 1.3.4
Fixed Problems with extracting files, if folder didn't exist yet
Also find shortcut with UpperCase

## 1.3.3
Fixed Network Drive file opening Problem and removed some Information Messages

## 1.3.2
Also read next lines in a AL File, if the first line doesn't contain the Object Infos

## 1.3.1
Fixed Bug, if input is same as a Object, it doesn't find the file

## 1.3.0
Added new Command "Package Search" to search only the objects of a specific package
Added the compatibility for multiple App Packages
Changed List View design when opening a AL File

## 1.2.1
Changed Features and Commands in README

## 1.2.0
Added functionality to show list of Objects on open File
Changed Activation Events

## 1.1.5
Fixed Startup Problems

## 1.1.4
Added Changelog for old versions

## 1.1.2 / 1.1.3
Changed minimum VS Code Version
Fixed Regenerate

## 1.1.1
Changed git package.json Publisher

## 1.0.0
Initial release of AL Object Helper

**Enjoy!**