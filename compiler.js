const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const configFile = path.join(process.cwd(), "compiler.config.js");
const configContent = require(configFile);

if (!configFile) {
  console.log(chalk.red("Config file not found."));
} else {
  // Read the HTML file
  fs.readFile(configContent.entry, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    // Extract the classes from the HTML
    const classRegex = /class=['"](.*?)['"]/g;
    let htmlClasses = [];
    let match;
    while ((match = classRegex.exec(data))) {
      htmlClasses = htmlClasses.concat(match[1].split(" "));
    }

    // Remove duplicates
    htmlClasses = [...new Set(htmlClasses)];

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

      // Write the used classes and styles to a new CSS file
      fs.writeFile(configContent.output, css, "utf8", (err) => {
        if (err) {
          console.error(err.message);
          return;
        }

        console.log(
          `${usedClasses.length} used classes with styles written to styles.css`
        );
      });
    });
  });
}
