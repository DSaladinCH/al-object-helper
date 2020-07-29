# AL Object Helper

If you work with large AL projects, you quickly lose track of your objects.
This extension helps you with this.
So you can quickly access objects without searching for them for a long time.
You can also jump to any Event Subscriber and implement any Event across all app Files with the integrated search.

With the latest version it is possible to jump to definition within an AL file.
This is a new feature and may still contain errors. Possibly there are also definitions which have not yet been implemented.
Please report these in the Git Repository.

## Features

* **Open Files** easy with a shortcut
* **Open Files** easy with their Name
* **Standard** and **Custom** Objects
* **Multiple Packages** are supported
* Search for Objects in a **specific App File**
* Copy any **Event Publisher** across all app Files
* Search any **local Event Subscriber** and jump to it
* Open the **Definition** of AL Variables, Functions and Fields inside a AL File (App AL Files)
* **Hover** on AL Variables, Functions and Fields inside a AL File (App AL Files)

You can open any AL File.
Just use the Object Shortcut and the ID.

### Shortcuts
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
**Ex. T27 for Item Table**
![Ex. T27 for Item Table](Images/vid01.gif)

**Ex. P21 for Customer Page**
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

* **Open AL File**: Open AL File with Type and ID or its Object Name (Shortcut Ctrl + Alt + O)
* **Regenerate**: Regenerate Temp Files for extension from local files and all app files
* **Package Search**: Search for a App Package and select any Object of the specific App Package
* **Search local AL Files**: Research all local AL Files
* **Copy Event**: Copy any Event (Integration Events and Triggers)
* **Search local Event Subscriber**: Search a local Event Subscriber and jump to it

## Known Issues

-

## Release Notes

**Newest Releases**

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


### 1.2.1

Changed Features and Commands in README

-----------------------------------------------------------------------------------------------------------

## Shortcuts

* Open AL File (`Ctrl+Alt+O` on Windows)
* Copy Event (`Shift+Alt+E` on Windows)

**Enjoy!**
