module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.resolve.fallback = {
                crypto: require.resolve("crypto-browserify"),
                stream: require.resolve("stream-browserify"),
                assert: require.resolve("assert/"),
                http: require.resolve("stream-http"),
                https: require.resolve("https-browserify"),
                os: require.resolve("os-browserify/browser"),
                url: require.resolve("url/"),
                buffer: require.resolve("buffer/"),
                string_decoder: require.resolve("string_decoder/"),
                events: require.resolve("events/"),
            };
            return webpackConfig;
        },
    },
};