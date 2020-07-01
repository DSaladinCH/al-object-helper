# AL Object Helper

If you work with large AL projects, you quickly lose track of your objects.
This extension helps you with this.
So you can quickly access objects without searching for them for a long time.

## Features

* **Open Files** easy with a shortcut
* **Open Files** easy with their Name
* **Standard** and **Custom** Objects
* **Multiple Packages** are supported
* Search for Objects in a **specific App File**

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


## Requirements

* [AL Language](https://marketplace.visualstudio.com/items?itemName=ms-dynamics-smb.al)

## Commands

* **Open AL File**: Open AL File with Type and ID or its Object Name (Shortcut Ctrl + Alt + O)
* **Regenerate**: Regenerate Temp Files for extension from local files and all app files
* **Package Search**: Search for a App Package and select any Object of the specific App Package

## Known Issues

-

## Release Notes

**Newest Releases**

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


-----------------------------------------------------------------------------------------------------------

## Shortcuts

* Open AL File (`Cmd+Alt+O` on macOS or `Ctrl+Alt+O` on Windows and Linux)

**Enjoy!**
