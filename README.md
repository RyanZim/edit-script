# edit-script

Edit npm scripts from the command line without worrying about json escaping.

[![asciicast](https://asciinema.org/a/97693.png)](https://asciinema.org/a/97693)

## Installation

```bash
npm install edit-script
```

## Usage

```
$ edit-script --help
Edit npm scripts from the command line without worrying about json escaping.

    edit-script
    edit-script <script>
```

Running `edit-script` will give you an interactive interface that allows you to choose a script or create a new one.

`edit-script <script>` allows you to select the script you want to edit on the command line. If `<script>` does not exist, it will allow you to create a new script with that name.

To delete a script, simply empty the script in the editor. `edit-script` will delete the key in the `package.json` for you.

## Editor Selection

`edit-script` uses the value of the `$VISUAL` or `$EDITOR` environment variables to determine the editor to use for script editing. If neither of these variables are defined, it defaults to `notepad` (on Windows) or `vim` (on Linux or Mac).

On some Linux distributions, you may get an error like this:

```
events.js:160
      throw er; // Unhandled 'error' event
      ^

Error: spawn vim ENOENT
    at exports._errnoException (util.js:1026:11)
    at Process.ChildProcess._handle.onexit (internal/child_process.js:193:32)
    at onErrorNT (internal/child_process.js:359:16)
    at _combinedTickCallback (internal/process/next_tick.js:74:11)
    at process._tickCallback (internal/process/next_tick.js:98:9)
```

This probably means that you do not have `$EDITOR` set, and the default of `vim` is not installed or available in your `$PATH`.

To fix this error, either install `vim`, or set `$EDITOR` in your `.bashrc`:

```bash
export EDITOR=nano
```

## License

MIT
