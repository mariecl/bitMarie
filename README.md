bitMarie
============

bitMarie is a bitTorrent client written in Node.js.
It is still a work in progress.
Currently, the bitMarie can contact a tracker and open a connection with peers, exchange messages with peers, request and download pieces from the file. The next step will be to write the downloaded pieces to disk.

###1. How do I get set up?###
* Make sure Node.js 0.10.x is installed and available with the node command
* Download or clone this repository
* Install the required Node.js packages by running the following command from the command line

```bash
npm install
```

* Download a torrent file and move it in the bitMarie folder

* Launch the application by running the following command from the command line, replacing './archlinux.torrent' by the path to your torrent file

```bash
node index.js download ./archlinux.torrent
```

* Launch your browser and go to http://localhost:8000/

###2. How do I use the application?###
* Go to [http://localhost:8000/](http://localhost:8000/) to authenticate yourself, and copy the access token which will be displayed at the end of the process.
* To get the list of all your calendars, go to _http://localhost:8000/calendars?accessToken=&lt;accessToken>_ replacing _&lt;accessToken>_ with the access token you previously copied.
* To get the list of the events in one of your calendars, go to _http://localhost:8000/calendars/&lt;calendarID>/events?accessToken=&lt;accessToken>_ and replace:
     -  &lt;calendarID> with a calendarID from the list of your calendars
     - &lt;accessToken> with the access token you previously copied

###3. How do I run the tests?###
To launch the unit tests, run:
```bash
npm test
```

The code coverage report will be generated in _coverage/lcov-report/index.html_

###4. What dependencies are used by this project?###
This project depends on the following Node.js libraries:

* request: for the HTTP client used to communicate with APIs

* chai: for the assertions in the tests

* istanbul: for the code coverage analysis

* mocha: for running the unit tests


All these dependencies are listed in the package.json file and automatically installed when running 

```bash
npm install
```

###5. What's the project structure?###
| directories   | contents                                                                          |
|---------------|-----------------------------------------------------------------------------------|
| lib           | contains all the classes used to download a file                                  |
| utils         | contains one file of common functions used in several other files from lib        |
| test          | contains tests files                                                              |


###6. What are the next steps?###
* Declare constants as constants in a separate file
* Write generic functions to send messages
* Clarify naming convention between file, piece, and blocks
* Update tests for pieceInfo
* Write tests for all the modules
* Build an interface for the client so that using it from the command line is not necessary anymore
* Enable multiple torrents downloading
* Handle reserved bits for bitTorrent protocol


###7. Who do I get in touch with?###
[Marie Clemessy](www.linkedin.com/pub/marie-clemessy/25/875/532/en)
