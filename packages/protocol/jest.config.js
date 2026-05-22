module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        "outDir": "./dist",
        "rootDir": ".",
      }
    }]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
