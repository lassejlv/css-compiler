#!/usr/bin/env node

/*
Copyright (c) 2022, Lasse Vestergaard
This file is a part of the CSS-compiler
*/

"use strict";

/*======== Required Packages ========*/
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const configFile = path.join(process.cwd(), "compiler.config.js");
const minify = require("cssmin");
const chokidar = require("chokidar");
const Id = require("yourid");
const TIME = Date.now();

if (!fs.existsSync(configFile)) {
  throw new Error(chalk.red("Config file for the compiler was not found."));
} else {
  try {
    const configContent = require(configFile);

    fs.readdir(__dirname || configContent.dir, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }

      const htmlFiles = files.filter(
        (file) => path.extname(file) === configContent.entry
      );
      let htmlClasses = [];

      htmlFiles.forEach((file) => {
        fs.readFile(file, "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }

          // Extract the classes from the HTML
          const classRegex = /class=['"](.*?)['"]/g;
          let match;
          while ((match = classRegex.exec(data))) {
            htmlClasses = htmlClasses.concat(match[1].split(" "));
          }

          // Remove duplicates
          htmlClasses = [...new Set(htmlClasses)];
        });
      });

      // Read the CSS file
      fs.readFile("style.css", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        // Extract the classes and styles from the CSS
        const cssRegex = /(?:^|\s)(\.[\w-]+)\s*\{([\s\S]*?)\}/g;
        let usedClasses = [];
        let css = "";
        let match;
        while ((match = cssRegex.exec(data))) {
          const className = match[1].slice(1);
          const styles = match[2];
          if (htmlClasses.includes(className)) {
            usedClasses.push(className);

            // If minify is set to true
            if (configContent.minify) {
              css += minify(`${match[1]} { ${styles} }\n`);
            } else {
              css += `${match[1]} { ${styles} }\n`;
            }
          }
        }

        /*======== CSS comment ========*/
        const COMMENT = `
/* 
  This file was compiled with 'css-compiler'.
  Compile Date: ${new Date().toDateString()}
  Compile Time: ${Date.now() - TIME}ms
  Compile Id: ${Id.generate({ length: 20 })}
  Github: https://github.com/lassv/css-compiler
*/
`;

        fs.writeFile(configContent.output, COMMENT + css, "utf8", (err) => {
          if (err) {
            console.error(err.message);
            return;
          }

          if (usedClasses.length === 0) {
            throw new Error(chalk.red("No classes was found."));
          } else {
            console.log(
              chalk.gray(
                `[${chalk.cyanBright(
                  new Date().toLocaleTimeString()
                )}] Found ${chalk.cyan(
                  usedClasses.length
                )} classes to compile...`
              )
            );

            console.log(
              chalk.gray(
                `[${chalk.cyanBright(
                  new Date().toLocaleTimeString()
                )}] Compiled classes in ${chalk.cyan(Date.now() - TIME + "ms")}`
              )
            );
          }
        });
      });
    });
  } catch (error) {
    throw new Error(chalk.red(error.message));
  }
}
