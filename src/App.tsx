import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { API, Application, DatasetType, IVector, PluginRegistry, PSEContextProvider, PSEPlugin, RootState, createRootReducer, PSELayer } from 'projection-space-explorer';
import * as THREE from 'three'
import { GLHeatmap } from './GLHeatmap';
import { Button, List, ListItem } from '@mui/material';
import { SoundPrint } from './SoundPrint';


export const DATASETCONFIG = [
  {
    display: "Andreas Album",
    path: "./coverart/names2.csv",
    type: DatasetType.Sound
  }
]







class SoundPlugin extends PSEPlugin {
  type = 'sound'

  createFingerprint(vectors: IVector[], scale: number, aggregate: boolean): JSX.Element {
    return <SoundPrint vectors={vectors} aggregate={aggregate}></SoundPrint>
  }

  hasFileLayout(header: string[]) {
    return this.hasLayout(header, ['wav', 'stft'])
  }
}

PluginRegistry.getInstance().registerPlugin(new SoundPlugin())

const api = //@ts-ignore
new API<RootState>(null, createRootReducer({}))


function FrontLayer() {
  return <PSELayer>
    <Button style={{ pointerEvents: 'all' }} onClick={() => {
      api.generateImage(1024, 1024, 64)
    }}>
      save
    </Button>
  </PSELayer>
}

export function CIMEApp() {

  const [context] = useState(
    api
  );

  

  return (
    <PSEContextProvider context={context}>
      <Application
      overrideComponents={{
        layers: [
          {
            order: 1,
            component: <FrontLayer></FrontLayer>
          }
        ]
      }}
      />
    </PSEContextProvider>
  );
}

export default CIMEApp;