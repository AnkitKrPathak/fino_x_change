const app = require("./app");

const PORT = process.env.PORT || 1335;

app.get('/', (req, res) => {
  res.send('Fino_X_Change API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
