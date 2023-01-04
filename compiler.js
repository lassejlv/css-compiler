#!/usr/bin/env node

/*
Copyright (c) 2022, Lasse Vestergaard
This file is a part of the CSS-compiler
*/

"use strict";

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const configFile = path.join(process.cwd(), "compiler.config.js");
const TIME = Date.now();

if (!fs.existsSync(configFile)) {
  throw new Error(chalk.red("Config file for the compiler was not found."));
} else {
  const configContent = require(configFile);

  // Compiler starts here.
  // Read all of the HTML files in the current directory

  try {
    fs.readdir(configContent.dir, (err, files) => {
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
            css += `${match[1]} { ${styles} }\n`;
          }
        }

        fs.writeFile(configContent.output, css, "utf8", (err) => {
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
