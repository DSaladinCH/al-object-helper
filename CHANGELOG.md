# Change Log
All versions of AL Object Helper will be documented in this file.

## [2.3.2] - 2023-01-30
### Add
- Support for app packages with different platform versions (Resolves [#60](https://github.com/DSaladinCH/al-object-helper/issues/60))

## [2.3.1] - 2022-12-21
### Fix
- ALFunction is not a function (Fixes [#71](https://github.com/DSaladinCH/al-object-helper/issues/71))

## [2.3.0] - 2022-12-06
### Add
- Performance Modes
  - Normal
  - Performance
  - Hyper Performance
- Reading event publisher after object selection
- Support for app package cache
- New command to reread specific app

### Fix
- Copied event subscriber not local all the time
- Licence Checker showing not necessary types

## [2.2.13] - 2022-11-05
### Fixed
- Empty files in app freezes object loading

## [2.2.12] - 2022-10-07
### Fixed
- Checking AppPath on macOS and Linux

## [2.2.10] - 2022-08-08
### Fixed
- License Checker not rendering

## [2.2.0] - 2022-05-29
### Added
- License Checker to check for objects out of range

## [2.1.4] - 2022-01-13
### Changed
- Minimum VS Code version to 1.60.0

## [2.1.3] - 2022-01-06
### Added
- Option to suppress the auto reload
- Reload command
- Option to only load symbol files
- Option to only show local files when running the command "Open AL Object"

### Fixed
- Fixed reload command to recreate the reader class

### Improved
- Shortened the vsix file

## [2.1.1] - 2021-06-11
### Fixed
- Reverted reloading of objects because of performance issues

## [2.1.0] - 2021-06-10
### Added
- Reload when opening the al object helper searchbar
  
### Fixed
- Fixed a event subscriber bug with array parameters

## [2.0.0] - 2021-05-06
### Improved
- Completely reworked extension and converted it to TypeScript
- Faster reading
- Better performance

## [1.6.3] - 2021-01-10
### Added
- Workspace support

### Fixed
- Bugs with BC 14

## [1.6.2] - 2020-12-10
### Fixed
- Some Hover bugs
- Some Definition bugs

## [1.6.1] - 2020-11-19
### Improved
- Performance on unzipping App Files

### Fixed
- Some Bugs on EventPublishers and Definition Provider 

## [1.6.0] - 2020-08-26
### Improved
- Performance on unzipping App Files

## [1.5.9] - 2020-08-24
### Fixed
- Some Bugs on EventPublishers and Definition Provider

## [1.5.8] - 2020-08-17
### Added
- Open Extended Object from an Extension Object

### Changed
- BC14 Symbols File Names

## [1.5.7] - 2020-08-16
### Added
- BC14 Symbols Support

## [1.5.6] - 2020-08-12
### Fixed
- Hovering in AL Files

## [1.5.5] - 2020-08-11
### Improved
- Performance on reading Files

## [1.5.4] - 2020-08-06
### Fixed
- Event search Problem

## [1.5.3] - 2020-08-03
### Fixed
- Bugs

## [1.5.2] - 2020-08-02
### Added
- Definition for Rec and xRec

### Fixed
- Bugs

## [1.5.1] - 2020-07-29
### Improved
- Huge Performance Improvement on initialization of searching AL Symbols

## [1.5.0] - 2020-07-24
### Added
- Definition Provider for all AL Files
- Hover Provider for all AL Files

## [1.4.1] - 2020-07-13
### Added
- Setting for path for extracted al Files

### Changed
- Logo

## [1.4.0] - 2020-07-12
### Added
- Copy Event Publisher
- Search local Event Subscriber

## [1.3.6] - 2020-07-09
### Changed
- Improved App File reading speed

### Fixed
- Fixed local search

## [1.3.5] - 2020-07-05
### Added
- Progressbar while reading the objects
- New Command for rereading local Files

### Fixed
- Regeneration Problems

## [1.3.4] - 2020-07-01
### Fixed
- Problems with extracting files, if folder didn't exist yet
- Also find shortcut with UpperCase

## [1.3.3] - 2020-07-01
### Fixed
- Network Drive Path opening Problem

### Removed
- Some Information Messages

## [1.3.2] - 2020-06-29
### Changed
- Read next lines in a AL File, if the first line doesn't contain the Object Infos

## [1.3.1] - 2020-06-28
### Fixed
- Bug, if input is same as a Object, it doesn't find the file

## [1.3.0] - 2020-06-28
### Added
- New Command "Package Search"
- Compatibility for multiple App Packages

### Changed
- List View for AL Objects

## [1.2.0] - 2020-06-25
### Added
- Show list of Objects on open File

### Changed
- Activation Events

## [1.1.5] - 2020-06-25
### Fixed
- Startup Problem

## [1.1.4] - 2020-06-25
### Added
- Changelog for old versions

## [1.1.3] - 2020-06-25
### Changed
- Minumum Visual Studio Code Version

### Fixed
- Regenration of AL Files

## [1.1.2] - 2020-06-25
### Changed
- Minumum Visual Studio Code Version

### Fixed
- Regenration of AL Files

## [1.1.1] - 2020-06-24
### Changed
- package.json GIT Publisher

## [1.0.0] - 2020-06-24
- Initial release

[2.3.2]: https://github.com/DSaladinCH/al-object-helper/compare/2.3.1...2.3.2
[2.3.1]: https://github.com/DSaladinCH/al-object-helper/compare/2.3.0...2.3.1
[2.3.0]: https://github.com/DSaladinCH/al-object-helper/compare/2.2.13...2.3.0
[2.2.13]: https://github.com/DSaladinCH/al-object-helper/compare/2.2.12...2.2.13
[2.2.12]: https://github.com/DSaladinCH/al-object-helper/compare/2.2.10...2.2.12
[2.2.10]: https://github.com/DSaladinCH/al-object-helper/compare/2.2.0...2.2.10
[2.2.0]: https://github.com/DSaladinCH/al-object-helper/compare/2.1.4...2.2.0
[2.1.4]: https://github.com/DSaladinCH/al-object-helper/compare/2.1.3...2.1.4
[2.1.3]: https://github.com/DSaladinCH/al-object-helper/compare/2.1.1...2.1.3
[2.1.1]: https://github.com/DSaladinCH/al-object-helper/compare/2.1.0...2.1.1
[2.1.0]: https://github.com/DSaladinCH/al-object-helper/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/DSaladinCH/al-object-helper/compare/1.6.3...2.0.0
[1.6.3]: https://github.com/DSaladinCH/al-object-helper/compare/1.6.2...1.6.3
[1.6.2]: https://github.com/DSaladinCH/al-object-helper/compare/1.6.1...1.6.2
[1.6.1]: https://github.com/DSaladinCH/al-object-helper/compare/1.6.0...1.6.1
[1.6.0]: https://github.com/DSaladinCH/al-object-helper/compare/1.5.2...1.6.0
[1.5.2]: https://github.com/DSaladinCH/al-object-helper/compare/1.5.1...1.5.2
[1.5.1]: https://github.com/DSaladinCH/al-object-helper/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/DSaladinCH/al-object-helper/compare/1.4.0...1.5.0
[1.4.0]: https://github.com/DSaladinCH/al-object-helper/compare/1.3.5...1.4.0
[1.3.5]: https://github.com/DSaladinCH/al-object-helper/compare/1.3.4...1.3.5
[1.3.3]: https://github.com/DSaladinCH/al-object-helper/compare/1.3.2...1.3.3
[1.3.2]: https://github.com/DSaladinCH/al-object-helper/compare/1.3.1...1.3.2
[1.3.1]: https://github.com/DSaladinCH/al-object-helper/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/DSaladinCH/al-object-helper/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/DSaladinCH/al-object-helper/compare/1.1.5...1.2.0
[1.1.5]: https://github.com/DSaladinCH/al-object-helper/compare/1.1.3...1.1.5
[1.1.3]: https://github.com/DSaladinCH/al-object-helper/releases/tag/1.1.3