const app = require("./app");

app.get('/', (req, res) => {
  res.send('Fino_X_Change API is running...');
});

const PORT = process.env.PORT || 1335;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
