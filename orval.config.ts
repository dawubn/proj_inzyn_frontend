import { defineConfig } from 'orval';

export default defineConfig({
    api: {
        input: './src/api/openapi.json',
        output: {
            mode: 'tags-split',
            target: './src/api/generated/endpoints.ts',
            schemas: './src/api/generated/model',
            client: 'react-query',
            httpClient: 'fetch',
            formatter: 'prettier',
            clean: true,
        },
    },
});