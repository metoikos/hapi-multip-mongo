'use strict';

const Hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const expect = require('code').expect;

describe('Hapi server', () => {

    let server;

    beforeEach((done) => {

        server = new Hapi.Server();
        done();
    });

    it('should reject invalid options', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                conn: 'mongodb://localhost:27017/test'
            }
        }, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('should fail with invalid mongodb uri ', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://:pass@localhost:27017/test'
            }
        }, (err) => {

            console.log("ERRR", err);

            expect(err).to.exist();
            done();
        });
    });

    it('should fail with no mongodb listening', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                url: 'mongodb://localhost:27018/test'
            }
        }, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('should be able to register plugin with just URL', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test'
            }
        }, done);
    });

    it('should be able to register plugin with URL and options', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test',
                options: {
                    db: {
                        /* eslint-disable camelcase */
                        native_parser: false
                        /* eslint-enable camelcase */
                    }
                }
            }
        }, done);
    });

    it('should be able to find the plugin exposed objects', (done) => {

        server.connection();
        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test'
            }
        }, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    const plugin = request.server.plugins['hapi-multi-mongo'];
                    expect(plugin.mongo).to.exist();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {
            });
        });
    });

    it('should be able to find the plugin exposed objects and custom name', (done) => {

        server.connection();
        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test',
                name: 'myMongo'
            }
        }, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    const plugin = request.server.plugins['hapi-multi-mongo'];
                    expect(plugin.myMongo).to.exist();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {
            });
        });
    });

    it('should be able to find the plugin on decorated objects', (done) => {

        server.connection();
        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test',
                decorate: true
            }
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.mongo).to.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    expect(request.mongo).to.exists();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {
            });
        });
    });

    it('should be able to find the plugin on decorated objects and custom name', (done) => {

        server.connection();
        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test',
                decorate: true,
                name: 'myMongo'
            }
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.myMongo).to.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    expect(request.myMongo).to.exist();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {
            });
        });
    });

    it('should be able to have multiple connections', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                connection: [
                    'mongodb://localhost:27017/test',
                    'mongodb://localhost:27017/local'
                ]
            }
        }, (err) => {

            expect(err).to.not.exist();

            const plugin = server.plugins['hapi-multi-mongo'];
            expect(plugin.mongo).to.be.an.object().and.to.have.length(2);
            expect(plugin.mongo).includes(['test', 'local']);

            done();
        });
    });

    it('should be able to have complex multiple connections', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                connection: [
                    {
                        uri: 'mongodb://localhost:27017/test',
                        options: {},
                        'name': 'myMongoConn1'
                    },
                    'mongodb://localhost:27017/local'
                ]
            }
        }, (err) => {

            expect(err).to.not.exist();

            const plugin = server.plugins['hapi-multi-mongo'];
            expect(plugin.mongo).to.be.an.object().and.to.have.length(2);
            expect(plugin.mongo).includes(['myMongoConn1', 'local']);

            done();
        });
    });

    it('should disconnect if the server stops', (done) => {

        server.register({
            register: require('../lib'),
            options: {
                connection: 'mongodb://localhost:27017/test'
            }
        }, (err) => {

            expect(err).not.to.exist();
            server.initialize(() => {

                server.stop(() => {

                    setTimeout(done, 100); // Let the connections end.
                });
            });
        });
    });
});
