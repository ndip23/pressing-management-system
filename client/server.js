const express = require("express");
const path = require("path");
const compression = require("compression");

const app = express();

app.use(compression());

app.use(
  express.static(path.join(__dirname, "build"), {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`React app running on port ${PORT}`));
