# Nest SDK
## A Nest CLI Plugin to Generate SDK's

### Install Dependency
```sh
  npm i nest-sdk
```

### Getting Started
#### Add plugin to plugins option in the Nest CLI Config
```json
  {
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
      "plugins": [ "nest-sdk" ]
    }
  }
```

### Custom Options

| Option | Type | Default | Description |
| :----  | :--: | :------ | :---------- |
| `appModulePath` | string | ./src/app.module.js | Relative path to the compiled app module, i.e. - the module passed to NestFactory.create |
| `appModuleClassName` | string | AppModule | Name of the class exported from app module being used by NestFactory.create |
| `generator` | string | typescript | Name of the generator to use. Possible options can be found [here](https://openapi-generator.tech/docs/generators) |
| `openApiGeneratorBinPath` | string | node_modules/.bin/openapi-generator-cli | Path to the openapi-generator-cli binary |
| `outputPath` | string | ./sdk | Path to generate the SDK |
| `port` | number | 9525 | Very unlikely this needs to change, it is used in the background for generation, but nonetheless it is configurable in case of another process living on the port |
| `silent` | boolean | false | If enabled the plugin will not log when the SDK is being generated in start/watch mode |
| `generationDebounceTicks` | number | 500 | Measured in ticks, this is the minimum required time to pass between SDK generations |

#### An example with modifying the options
```json
  {
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
      "plugins": [
        {
          "name": "nest-sdk",
          "options": {
            "appModulePath": "./dist/server.module.js",
            "appModuleClassName": "ServerModule",
            "generator": "typescript-axios",
            "openApiGeneratorBinPath": "/usr/local/bin/openapi-generator-cli",
            "outputPath": "dist/sdk",
            "port": 8082,
            "silent": true,
            "generationDebounceTicks": 1000
          }
        }
      ]
    }
  }
```

### Minimum Required Version
NodeJS >=20
- [import.meta.dirname](https://nodejs.org/api/esm.html#importmetadirname) v20
- [Node Protocol]() *Possibly v18*
- [Dynamic Import]() *Possibly v14*

NodeJS ES feature support docs: https://node.green/
