# Stringify CLI
The Stringify Command Line Interface (CLI) can be used to download and upload your strings from the command line.
To get started, please follow the installation instructions below.

## Installation
You can install the Stringify CLI using npm, make sure [Node.js](https://nodejs.org/) version 10 or higher is installed on your system first.

Run the following command to install the Stringify CLI globally:
```bash
npm install -g stringify-cli
```

## Commands
Run `stringify --help` to list all available commands. Specific commands can be executed using the following format: `stringify <command>`.

Below you can find a list of all commands and their function:

| Command | Description                                         |
|---------|-----------------------------------------------------|
| config  | Configure the Stringify CLI                         |
| init    | Initialize project                                  |
| sync    | Synchronize locale files with server (push & pull)  |
| pull    | Download locale files from server                   |
| push    | Upload locale files to server                       |

### config
The `stringify config` command configures the Stringify CLI, this process starts automatically when the CLI is used for the first time.
Instructions will be provided which lead you through the steps of obtaining an API-token. 
This token should be provided to the Stringify CLI in order to communicate with the server. 
Alternatively, you can set the environment variable `STRINGIFY_API_TOKEN` for use in CI environments.

### init
Run `stringify init` in order to initialize a Stringify project in your current working directory.
This project should have already been created using the web interface.

You will be run through the following steps:
1. All your projects will be listed, select the desired project using the arrow (up/down) keys.
2. Select the desired localizations with the `space` key, the available options can be set using the web interface.
3. Pick the format that should be used for the locale files.
4. The Stringify CLI will automatically try to resolve the location of the locale files, based on the picked format (step 3). 
 When these files couldn't be found, you will be prompted to enter the path for the files manually. 
5. Your final settings will be saved in a `stringify.config.json` file, this file is used by all project-specific commands. 
 See the [Config file](#config-file) section for more details.

### sync
The `stringify sync` command runs the [push](#push) and [pull](#pull) commands sequentially. 
We recommend you to use this command instead of running the `push` and `pull` commands separately.

**-f, --force**
Executes the command in force mode, see the `--force` section of the [push](#push) command for more information.

### pull
`stringify pull` downloads the latest version of the locale files from the server and stores them at the specified locations (see [config](#config)).
Existing locale files will be overwritten with the downloaded version. 
Please be aware this can result in the loss of the latest non-synchronized version of your files. 
Therefore, we recommend you to run the `push` command first, or just use the `sync` command.

### push
The `stringify push` command uploads the changes in your local locale files to the server. 
Firstly, the local changes are inspected by comparing your local files with the latest version that was pulled from the server.
The CLI lists all updated, created and deleted strings, and confirms whether the changes can be pushed to the server. 
In case another user changed or added the same string after your last pull, a conflict occurs. 
The CLI will subsequently ask you which version should be used in the final version.

If new strings were created, you will be asked whether these strings should be marked as translated or not. 
This can be useful when the created strings contain dummy or temporary content, that still needs to be translated by the editor.

**-f, --force**
When using the `--force` option, the CLI won't ask you to confirm the mutations. 
New strings will always be marked as 'Untranslated', and conflicts will result in an error. 
This makes the CLI suitable for use in automated processes like CI software.

## Config file
The `stringify.config.json` file defines the Stringify settings for your project directory. 
The file is automatically generated by using the `init` command, but you are free to create the file manually as well. 
A Stringify config file contains a JSON object with the following keys.

### format
Format for the locale files in the project directory. Should be one of the supported formats by Stringify, like `apple`, `android` or `json`.

### projects
Array of Stringify projects relevant for this directory. Each object of the array contains the following keys.

#### projects[].id
Stringify ID of the project, which can be found by inspecting the translation page URL on Stringify. When the URL is `https://company.stringify.app/projects/487/translate`, the ID is `487`.

#### projects.name
Name for the project. This value is only used for display purposes in the CLI, and has no technical/functional value.

#### projects.localizations
Array of localizations that are used for the project. Each object of the array contains the following keys.

#### projects.localizations.locale
Locale of the localization, in [639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format.

#### projects.localizations.path
Path of the locale file for this localization, relative to the project directory. This value may contain a [glob](https://en.wikipedia.org/wiki/Glob_(programming)) expression.

#### projects.localizations.mirrors (optional)
An optional array of paths for mirrored locale files. When new strings are pulled from the server, the latest version is saved in these mirrored files as well. 
However, when pushing locale files to the server the mirrored files are ignored. 
This is useful when the locale file needs te be present at multiple locations in the project directory.

## Lockfile
When strings are pulled for the first time, a `stringify.lock.json` file is generated automatically. 
This file contains the version of the pulled strings for each localization. You should not edit this file manually.
