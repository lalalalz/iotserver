import mosca   from 'mosca';
import mqtt    from 'mqtt';
import mariadb from 'mariadb';
import logger  from './logger';  // 생성 필요

interface IMqttBrokerManagerOptions {
    // 옵션값은 http://www.mosca.io/docs/를 참고하며, 
    // 옵션값을 추가하여 사용할 수 있다. 
    port: number,               
    host: string,               
    maxConnection: number,      
    maxInflightMessages: number,
}

interface IMqttSetDeviceMessageHandlerOptions {
    topic: string,
    event: number,
}

interface IMqttSetAppMessageHandlerOptions {
    topic: string,
    cmd: number,
}

interface IRestAPIManagerOptions {


}

interface IDBManagerOptions {
    // 옵션값은 https://mariadb.com/kb/en/connector-nodejs-promise-api/#createpooloptions-pool의 
    // createPool 부분을 참고하며, 옵션값을 추가하여 사용할 수 있다.
    user: string,
    password: string,
    host: string,
    port: number,
    database: string,
    connectTimeout: number,
}

class Logger {
    public logger: any
    
    // 수정 필요
    Logger(): any {
        this.logger = null;
        return this.logger;
    };

    // 수정 필요
    public setLogger(): boolean {
        return true;
    }
}


class Manager {

    protected id: number;
    protected logger: Logger;

    Manager() {
        this.logger = new Logger();
    };

    protected getID(): number {
        return this.id;
    };

    protected setID(id: number): void {
        this.id = id;
    }
}

abstract class aMbm extends Manager {

    protected broker: mosca.Server;   // MQTT Broker
    protected listner: mqtt.Client;   // MQTT All Message Listener (MQTT Client)
    protected flag: boolean           // MQTT Broker work flag
    protected procedure: Array<()>;

    aMbm() {};

    private topicProcedure(): void {
        if(this.flag && this.listner) {
            
        }
    }

    public abstract createMqttBroker(options: mosca.ServerOptions): Promise<Mbm>;
    public abstract suspendMqttBroker(): Promise<boolean>;
    public abstract deleteMqttBroker(): Promise<boolean>;

    public abstract subscribe(topic: string): Promise<boolean>;
    public abstract publish(topic: string, message: string): Promise<boolean>;

    // 토픽별 프로시저 등록
    // 토픽별 프로시저 등록 해제
    public abstract addTopicProceduer(topic: string): boolean;                                                         
    public abstract deleteTopicProceduer(topic: string): boolean;                                                      

    // 한 토픽에 대한 사용자 정의 구분자별 핸들러 등록
    // 한 토픽에 대한 사용자 정의 구분자별 핸들러 등록 해제
    public abstract addCommandHandler(topic: string, cmd: number, handler: (topic: string, message: string) => void): number;        
    public abstract deleteCommandHandler(topic: string, cmd: number): boolean;        
    
    // 토픽에 대한 사용자 정의 구분자별 없이 핸들러만 등록
    // 토픽에 대한 사용자 정의 구분자별 없이 핸들러만 등록 해제
    public abstract addHandler(topic: string, handler: (topic: string, message: string) => void): number;
    public abstract deleteHandler(handlerID: number, topic: string): boolean;

}

class Procedure<T> {

    private topic: string;
    private cases: Array<T>;
    // private logger: Logger;

    Procedure(topic: string) {
        this.topic = topic;
    };

    public getTopic(): string {
        return this.topic;
    }

    public findCase(case: T): number {
        for(let i = 0; i < cases.length; ++i) {
            if(case == cases[i])  return i;
        }
        return -1;
    }

    public setCase(case: T): boolean {
        if(findCase(case)) {
            logger.error('case already exists');
            return false;
        }
        else {
            cases.push(case);
            return true;
        }
    }

}

class TopicProcedures<T> {

    private procedures: Array<Procedure<T>>
}

class Mbm extends aMbm {

    Mbm() {
        
    }

    public createMqttBroker(options: mosca.SeverOptions): Promise<Mbm> {
        return new Promise((resolve, reject) => {
            this.broker = mosca.Server(options, () => {

                this.logger.info("MQTT BROKER ON...");
                this.listner = mqtt.connect(options.host + ":" + options.port);

                this.listner.on('reconnect', async () => {
                    this.logger.error('reconnected MQTT Client to Broker....');
                    this.listner = mqtt.connect(options.host + ":" + options.port);
                });

                this.listner.on('connect', async () => {
                    this.logger.info('MQTT Client connected to Broker...');
                    resolve(this);
                });
            });
        });
    }

    public suspendMqttBroker(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(!this.flag) {
                this.flag = true;
                logger.info('MQTT BROKER suspended...');
                resolve(true);
            }
            else {
                logger.error('cannot suspend MQTT BROKER... broker not created yet...');
                resolve(false);
            }
        });
    }

    public deleteMqttBroker(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(this.broker && this.listner) {
                this.listner.end(() => {
                    this.broker.close(() => {
                        logger.info('MQTT BROKER deleted...');
                        resolve(true);
                    });
                }));
            }
            else {
                logger.error('cannot delete MQTT BROKER... broker not created yet...');
                resolve(false);
            }
        });
    }

    public subscribe(topic: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if(!this.broker || !this.listner) {
                logger.error('cannot subscribe... broker or client not created yet...');
                resolve(false);
            }
            this.broker.subscribe(topic, (err, granted) => {
                if(err)  reject(err);
                logger.info(`subscribed ${granted.topic} topic`);
                resolve(true);
            });
        });
    }

    public publish(topic: string, message: string) Promise<boolean> {
        return new Prmoise((resolve, reject) => {
            if(!this.broker || !this.listner) {
                logger.error('cannot publish... broker or client not created yet...')
                resolve(false);
            }
            else {
                this.listner.publish(topic, message, () => {
                    logger.info('published to ${topic}...');
                    resolve(true);
                });
            }
        });
    }



    public addTopicProceduer(topic: string): boolean {

    }
}

abstract class Ram extends Manager{

    private pool: mariadb.Pool;   // DB Pool

    Mbm() {};

    public abstract createMqttBroker(settings: IMqttBrokerManagerOptions): Promise<Mbm>;
    public abstract suspendMqttBroker(): Promise<boolean>;
    public abstract deleteMqttBroker(): Promise<boolean>;

    public abstract subscribe(topic: string): Promise<boolean>;
    public abstract publish(topic: string, message: string): Promise<boolean>;
}

abstract class Dbm {

    private pool: mariadb.Pool;   // DB Pool

    Dbm() {};

    public abstract createMqttBroker(settings: IMqttBrokerManagerOptions): Promise<Mbm>;
    public abstract suspendMqttBroker(): Promise<boolean>;
    public abstract deleteMqttBroker(): Promise<boolean>;

    public abstract subscribe(topic: string): Promise<boolean>;
    public abstract publish(topic: string, message: string): Promise<boolean>;
}

abstract class Server {

    private Mbms: Array<Mbm>;     // MQTT Broker Manger
    private Rams: Array<Ram>;     // REST API Manager
    private Dbms: Array<Dbm>;     // DB Manager
    
    private countOfManager: number = 0;

    Server() {};

    public abstract addMqttBrokerManager<T>(settings: IMqttBrokerManagerOptions): Promise<T>;
    public abstract addRestAPIManager<T>(settings: IRestAPIManagerOptions): Promise<T>;
    public abstract addDBManager<T>(settings: IDBManagerOptions): Promise<T>;

    public abstract deleteMqttBrokerManager(id: number): Promise<boolean>;
    public abstract deleteRestAPIManager(id: number): Promise<boolean>;
    public abstract deleteDBManager(id: number): Promise<boolean>;

    public abstract suspendMqttBrokerManager(id: number): Promise<boolean>;
    public abstract suspendRestAPIManager(id: number): Promise<boolean>;
    public abstract suspendDBManager(id: number): Promise<boolean>;

    public abstract getMqttBrokerMangerID(Mbm: Mbm): number;
    public abstract getRestAPIManagerID(Ram: Ram): number;
    public abstract getDBManagerID(Dbm: Dbm): number;

    public abstract numberOfMbm(): number;
    public abstract numberOfRam(): number;
    public abstract numberOfDbm(): number;

}

