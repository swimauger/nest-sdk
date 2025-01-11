import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import ts from 'typescript';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestCompilerPlugin } from '@nestjs/cli/lib/compiler/plugins/plugins-loader.js';
import { ConsoleLogger } from '@nestjs/common';

const execFileAsync = promisify(execFile);
const logger = new ConsoleLogger();

interface NestSdkPluginOptions {
  appModulePath: string;
  appModuleClassName: string;
  generator: string;
  openApiGeneratorBinPath: string;
  outputPath: string;
  silent: boolean;
  
  port: number;
  generationDebounceTicks: number;
}

async function generateSdk(options: NestSdkPluginOptions) {
  try {
    if (!options.silent) logger.log('Starting Nest SDK generation...', 'NestSdkPlugin');
    const appModule = await import(path.relative(import.meta.dirname, options.appModulePath));
    const appModuleClass = appModule[options.appModuleClassName];
    var app = await NestFactory.create(appModuleClass, {
      logger: false
    });
    const doc = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    SwaggerModule.setup('openapi', app, doc);
    await app.listen(options.port);
    await execFileAsync(options.openApiGeneratorBinPath, [
      'generate',
      '-g',
      options.generator,
      '-i',
      'http://localhost:9525/openapi-json',
      '-o',
      options.outputPath
    ]);
  } catch (error) {
    // TODO: Implement an enqueue generate sdk factory function to prevent generating an sdk while sdk is being generated during watch changes.
    if (!options.silent && error.code !== 'EADDRINUSE') logger.error(error, 'NestSdkPlugin');
  } finally {
    if (!options.silent) logger.log('Nest SDK generated successfully', 'NestSdkPlugin');
    await app.close();
  }
}

function createDebouncedGenerateSdk() {
  let timeout: NodeJS.Timeout;
  return function debouncedGenerateSdk(options: NestSdkPluginOptions) {
    clearTimeout(timeout);
    timeout = setTimeout(
      () => generateSdk(options),
      options.generationDebounceTicks
  );
  }
}

const debouncedGenerateSdk = createDebouncedGenerateSdk();

export const after: NestCompilerPlugin['after'] = (userOptions, program) => {
  const options: NestSdkPluginOptions = {
    appModuleClassName: 'AppModule',
    appModulePath: path.resolve(program.getCompilerOptions().outDir, 'app.module.js'),
    generationDebounceTicks: 500,
    generator: 'typescript',
    openApiGeneratorBinPath: path.resolve(process.cwd(), 'node_modules/.bin/openapi-generator-cli'),
    outputPath: 'sdk',
    port: 9525,
    ...userOptions,
    silent: !('preserveWatchOutput' in program.getCompilerOptions()) && userOptions.silent,
  };
  debouncedGenerateSdk(options);
  return function(_context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    return function(sourceFile: ts.SourceFile): ts.SourceFile {
      debouncedGenerateSdk(options);
      return sourceFile;
    }
  };
}
