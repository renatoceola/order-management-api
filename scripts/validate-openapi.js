import SwaggerParser from '@apidevtools/swagger-parser';

await SwaggerParser.validate('docs/openapi.yaml');
console.warn('Especificacao OpenAPI valida.');
