# AL Object Helper
If you are working in large AL projects, you quickly lose track of your objects. \
This extension supports you with this problem. \
Quickly access any object within your workspace. \
Open local objects and app package objects. \
Are you searching for a event subscriber? Just jump right to it. \
Searching for a event? Just use the integrated event search and copy the function to your clipboard.

In a app package object, it is possible to view definitions and hover over them. \
This functionality may still contain errors. Possibly there are also definitions which have not yet been implemented. \
Please report these in the git Repository.

Also, please report any bug in the git repository.

## Features
* **Open objects** with a easy shortcut
* **Search objects** by their names
* **Local** and **App Package** objects
* Search for objects within a **specific app file**
* Search and copy **Event Publishers** of any object
* Search and jump right to any event subscriber in your project
* **Definitions** in all App Package objects
* **Open Extended Object** to quickly go to its parent object
* **Show Extensions** to view and open all extension of the current object

## Planned features
* **Research** all objects and app packages
* Automatically research when changing branch
* Automatically research when downloading symbols

## Shortcuts
To quickly open any object you can use a object shortcut. \
Just run the command **Open AL Object** and type the type shortcut and the object id.
* T = Open a Table
* TE = Open a TableExtension with the Table ID
* TED = Open a TableExtension
* P = Open a Page
* PE = Open a PageExtension with the Page ID
* PED = Open a PageExtension
* E = Open a Enum
* EE = Open a Enum Extension with the Enum ID
* EED = Open a EnumExtension
* R = Open a Report
* X = Open a XmlPort

## Examples
**Ex. T27 for Item Table** \
![Ex. T27 for Item Table](Images/vid01.gif)

**Ex. P21 for Customer Page** \
![Ex. P21 for Customer Page](Images/vid02.gif)

## Important Infos
If you use the latest version of the AL Language Extension by Microsoft, you have to remove the "AL: Find Event" keybinding to use the integrated search.
![Remove the "AL: Find Event" keybinding](Images/vid03.gif)

With the latest version it is possible to jump to definition within an AL file.
This is a new feature and may still contain errors. Possibly there are also definitions which have not yet been implemented.
Please report these in the Git Repository.

## Requirements
* [AL Language](https://marketplace.visualstudio.com/items?itemName=ms-dynamics-smb.al)

## Commands
* **Open AL Object**: Search for any object (Shortcut: Ctrl + Alt + O)
* **Open AL Object of App**: Search for any object in a specific app
* **Copy Event**: Search and copy any event of a object (Shortcut: Shift + Alt + E)
* **Jump to local Event Subscriber**: Search for a local event subscriber and jump right to it
* **Open extended Object**: Open the extended object of the current object
* **Show Extensions**: Show all extensions for the current object

## Shortcuts
* Open AL Object (`Ctrl+Alt+O` on Windows)
* Copy Event (`Shift+Alt+E` on Windows)

## Known Issues
- Reloading of objects causes perfomance issues

## Release Notes
### 2.1.4
- Changed minimum VS Code version to 1.60.0

### 2.1.3
- Added option to only load symbol files
- Added option to only show local files when running the command "Open AL Object"
- Fixed reload command to recreate the reader class

### 2.1.2
- Added option to suppress the auto reload
- Added reload command
- Shortened the vsix file

### 2.1.1
- Reverted reloading of objects because of performance issues

### 2.1.0
- Fixed a event subscriber bug with array parameters
- Added a reload when opening the al object helper searchbar

### 2.0.0
- Completely reworked extension and converted it to TypeScript
- Faster reading
- Better performance

### 1.6.3
- Added workspace support
- Fixed some bugs with BC 14

### 1.6.2
- Fixed some Hover bugs
- Fixed some Definition bugs

### 1.6.1
- Improved performance on unzipping App Files
- Fixed some Bugs on EventPublishers and Definition Provider 

### 1.6.0
- Improved performance on unzipping App Files

### 1.5.9
- Fixed some Bugs on EventPublishers and Definition Provider

### 1.5.8
- Added new functionallity to open the extended Object from an extension Object
- Changed BC14 Symbols File Names

### 1.5.7
- Added BC14 Symbols Support

### 1.5.6
- Fixed hovering in AL Files

### 1.5.5
- Improved Performance on reading Files

### 1.5.4
- Fixed Event search problem

### 1.5.3
- Fixed Bugs

### 1.5.2
- Added Definition for Rec and xRec
- Fixed Bugs

### 1.5.1
- Huge Performance Improvement

### 1.5.0
- Added Definition Provider for all AL Files
- Added Hover Provider for all AL Files

### 1.4.1
- Added Setting for the extracted AL Files
- Changed logo

### 1.4.0
- Added feature to copy any Event Publisher
- Added feature to search any local Event Subscriber and jump to it

### 1.3.6
- Improved App File reading speed
- Fixed local search

### 1.3.5
- Added a Progressbar while reading the objects
- Added a new Command for rereading local Files
- Fixed Regeneration Problems

### 1.3.4
Fixed Problems with extracting files, if folder didn't exist yet
Also find shortcut with UpperCase

### 1.3.3
Fixed Network Drive file opening Problem and removed some Information Messages

### 1.3.2
Also read next lines in a AL File, if the first line doesn't contain the Object Infos

### 1.3.1
Fixed Bug, if input is same as a Object, it doesn't find the file

### 1.3.0
Added new Command "Package Search" to search only the objects of a specific package
Added the compatibility for multiple App Packages
Changed List View design when opening a AL File

### 1.2.1
Changed Features and Commands in README

### 1.2.0
Added functionality to show list of Objects on open File
Changed Activation Events

### 1.1.5
Fixed Startup Problems

### 1.1.4
Added Changelog for old versions

### 1.1.2 / 1.1.3
Changed minimum VS Code Version
Fixed Regenerate

### 1.1.1
Changed git package.json Publisher

### 1.0.0
Initial release of AL Object Helper

**Enjoy!**