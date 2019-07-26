<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for build-url, contributors-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Build Status][build-shield]][build-url]
[![Contributors][contributors-shield]][contributors-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/kosset/duty-bot">
    <img src="https://www.dropbox.com/s/mq0a0a03epfuklc/dutybot.jpg?dl=1" alt="Logo" width="" height="80" style="border-radius:50%;">
  </a>

  <h3 align="center">Duty-Bot</h3>

  <p align="center">
     A Greek FB Messenger chatbot created to serve the nearest pharmacies on duty for a specified location.
    <br />
    <a href="https://github.com/kosset/duty-bot"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://m.me/dutybot">Chat with the bot</a>
    ·
    <a href="https://github.com/kosset/duty-bot/issues">Report Bug</a>
    ·
    <a href="https://github.com/kosset/duty-bot/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)
* [Acknowledgements](#acknowledgements)



<!-- ABOUT THE PROJECT -->
## About The Project

[![Dutybot-Screenshot][product-screenshot]](https://m.me/dutybot)

There are many times in our life that we are in need of a pharmacy in the middle of the night. That is why I created the Dutybot, it asks for a user's location and then it serves the nearest pharmacies that are on duty.

The project is separated in two Services, the Bot and the Web Scrapper-API. This repository implements the Bot service. The Web Scrapper-API will be uploaded later on github.

The Bot service connects the Communication Channels (at the momment FB Messenger) with an Natural Language Understanding platform (Wit.ai or Dialogflow) and the database (soon to be changed communication with the API directly) and serves to Users details about the Pharmacies.

### Built With

* NodeJS
* MongoDB

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally. To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* NodeJS (at least v10.15.3)
* MongoDB (v4.0)
* Facebook Account


### Installation

1. Clone the repo
```sh
git clone https:://github.com/kosset/duty-bot.git
```
2. Install NPM packages
```sh
npm install
```
3. Create Bot App in FB and add the credentials in the config file



<!-- USAGE EXAMPLES -->
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_



<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/kosset/duty-bot/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Your Name - [@your_twitter](https://twitter.com/your_username) - email@example.com

Project Link: [https://github.com/your_username/repo_name](https://github.com/your_username/repo_name)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
* [Img Shields](https://shields.io)
* [Choose an Open Source License](https://choosealicense.com)
* [GitHub Pages](https://pages.github.com)
* [Animate.css](https://daneden.github.io/animate.css)
* [Loaders.css](https://connoratherton.com/loaders)
* [Slick Carousel](https://kenwheeler.github.io/slick)
* [Smooth Scroll](https://github.com/cferdinandi/smooth-scroll)
* [Sticky Kit](http://leafo.net/sticky-kit)
* [JVectorMap](http://jvectormap.com)
* [Font Awesome](https://fontawesome.com)





<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[build-shield]: https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square
[build-url]: #
[contributors-shield]: https://img.shields.io/badge/contributors-1-orange.svg?style=flat-square
[contributors-url]: https://github.com/kosset/duty-bot/graphs/contributors
[license-shield]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: https://choosealicense.com/licenses/mit
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/ksetzas
[product-screenshot]: https://www.dropbox.com/s/f9mnd96p9314ev2/startof-dutybot-small.png?raw=1
