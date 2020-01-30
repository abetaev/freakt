import React, {Component, RefObject} from 'react';
import Peer from 'peerjs';
import {
    Paper,
    TextField,
    Button,
    Card,
    CardMedia,
    CardActions,
    CardContent,
    Container,
    IconButton,
    Chip,
    Avatar
} from '@material-ui/core';
// import { Pause, PlayIcon }from '@material-ui/icons';
import copy from 'copy-to-clipboard';
import './Comm.scss';

import { contact, play } from 'ionicons/icons';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonChip,
    IonAvatar,
    IonLabel,
    IonIcon,
    IonItem,
    IonInput,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonFab,
    IonFabButton
} from "@ionic/react";


interface CommI { [identity: string]: MediaStream }
type Network = {
    peer: Peer
    connections: { [identity: string]: Peer.MediaConnection }
} | undefined;

const cs = window.crypto.subtle;

class Comm extends Component {

    private comm: CommI = {};
    private videos: { [identity: string]: RefObject<any> } = {};
    private network: Network;

    constructor(props: any) {
        super(props);
        this.state = {
            isSelfConnected: false,
            isIdCopied: false
        };

        this.init();
    }

    isLocalIdentity(identity: String) { return this.network != null && identity === this.network.peer.id; }

    async init() {
        const keyPair = await cs.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 256,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            [
                "encrypt",
                "decrypt"
            ]
        );

        const jwk = await cs.exportKey("jwk", keyPair.publicKey);
        this.network = { peer: new Peer(jwk.n), connections: {} };

        this.network.peer.on("call", call => {
            // @ts-ignore
            call.answer(this.comm[this.network.peer.id]);
            call.on("stream", stream => {
                // @ts-ignore
                this.comm[call.peer] = stream;
                this.setState({ comm: this.comm });
                // state.set({ network: this.network, comm: this.comm })
            })
        });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // @ts-ignore
        this.comm[this.network.peer.id] = stream;

        this.setState({ isSelfConnected: true, network: this.network, comm: this.comm });
    }

    render() {

        if(this.network == null) return null;
        // @ts-ignore
        const { isIdCopied } = this.state;

        return (
            <IonPage>
                <Container className="ion-padding">
                    <Chip avatar={<Avatar>I</Avatar>}
                          label={!isIdCopied ? this.network.peer.id:'Copied in clipboard'}
                          onClick={()=> {
                        // @ts-ignore
                        copy(this.network.peer.id, {
                            debug: true,
                            message: 'Press #{key} to copy',
                        });
                        this.setState({ isIdCopied: true });
                        setTimeout(()=>{
                            this.setState({ isIdCopied: false });
                        }, 2000);
                    }}/>
                    <IonItem>
                        <IonLabel position="floating">Enter User-Id to Call</IonLabel>
                        <IonInput onKeyPress={({key, target}) => {
                            if (key === "Enter") {
                                // @ts-ignore
                                const identity: string = target['value']
                                // @ts-ignore
                                const call = this.network.peer.call(identity, this.comm[this.network.peer.id])
                                call.on('stream', (stream: any) => {
                                    // @ts-ignore
                                    this.comm[identity] = stream
                                    this.setState({ comm: this.comm });
                                })
                            }
                        }}/>
                    </IonItem>
                    {Object.keys(this.comm)
                        .map(identity => {
                            const ref = React.createRef<HTMLVideoElement>();
                            this.videos[identity] = ref;
                            if(this.videos[identity].current) {
                                this.videos[identity].current.srcObject = this.comm[identity];
                            }
                            const isLocalIdentity = this.isLocalIdentity(identity);
                            return (
                                <IonCard key={identity}>
                                    <IonCardContent>
                                        <video
                                            autoPlay
                                            muted={true}

                                            style={{height: '200px'}}
                                            key={identity}
                                            width="100%"
                                            ref={ref => { if(ref) { ref.srcObject = this.comm[identity]; } }}
                                            /* muted={identity === this.network.peer.id} */
                                        />
                                    </IonCardContent>
                                    <IonCardHeader>
                                        <IonCardSubtitle>Peer Id</IonCardSubtitle>
                                        <IonCardTitle>{identity}</IonCardTitle>
                                    </IonCardHeader>
                                    <IonFab vertical="bottom" horizontal="start"
                                            slot="start">
                                        <IonFabButton onClick={() => {
                                            // @ts-ignore
                                            return ref.current.play()
                                        }}>
                                            <IonIcon icon={play}/>
                                        </IonFabButton>
                                    </IonFab>
                                </IonCard>
                            )
                        })
                    }
                </Container>
            </IonPage>
        );

        /* return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Ionic Blank</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <Container className="ion-padding">
                    <IonChip onClick={()=> {
                        // @ts-ignore
                        copy(this.network.peer.id, {
                            debug: true,
                            message: 'Press #{key} to copy',
                        });
                        this.setState({ isIdCopied: true });
                        setTimeout(()=>{
                            this.setState({ isIdCopied: false });
                        }, 2000);
                    }}>
                        <IonAvatar>

                            <img src={`${contact.md}`} />
                        </IonAvatar>
                        <IonLabel className="selfIdLabel">{!isIdCopied ? this.network.peer.id:'Copied in clipboard'}</IonLabel>
                    </IonChip>
                    <IonItem>
                        <IonLabel position="floating">Enter User-Id to Call</IonLabel>
                        <IonInput onKeyPress={({key, target}) => {
                            if (key === "Enter") {
                                // @ts-ignore
                                const identity: string = target['value']
                                // @ts-ignore
                                const call = this.network.peer.call(identity, this.comm[this.network.peer.id])
                                call.on('stream', (stream: any) => {
                                    // @ts-ignore
                                    this.comm[identity] = stream
                                    this.setState({ comm: this.comm });
                                })
                            }
                        }}/>
                    </IonItem>
                    {Object.keys(this.comm)
                        .map(identity => {
                            const ref = React.createRef<HTMLVideoElement>()
                            return (
                                <IonCard key={identity}>
                                    <IonCardContent>
                                        <video
                                            style={{height: '200px'}}
                                            key={identity}
                                            width="100%"
                                            ref={ref}
                                            onPlay={() => {
                                                // @ts-ignore
                                                return ref.current.srcObject = this.comm[identity]
                                            }}
                                            // @ts-ignore
                                            muted={identity === this.network.peer.id}/>
                                    </IonCardContent>
                                    <IonCardHeader>
                                        <IonCardSubtitle>Peer Id</IonCardSubtitle>
                                        <IonCardTitle>{identity}</IonCardTitle>
                                    </IonCardHeader>
                                    <IonFab vertical="bottom" horizontal="start"
                                            slot="start">
                                        <IonFabButton onClick={() => {
                                            // @ts-ignore
                                            return ref.current.play()
                                        }}>
                                            <IonIcon icon={play}/>
                                        </IonFabButton>
                                    </IonFab>
                                </IonCard>
                            )
                        })
                    }
                </Container>
            </IonPage>
        ); */
    }
}

export default Comm;
