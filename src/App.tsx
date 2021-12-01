import React, { Ref, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { API, Application, DatasetType, IVector, PluginRegistry, PSEContextProvider, PSEPlugin, rootReducer, RootState, setDatasetEntriesAction, CSVLoader, Dataset, RootActions, createRootReducer } from 'projection-space-explorer';
import * as THREE from 'three'
import { GLHeatmap } from './GLHeatmap';
import { List, ListItem } from '@mui/material';
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




export function CIMEApp() {
  const api = //@ts-ignore
    new API<RootState>(null, createRootReducer({}))

  const [context] = useState(
    api
  );



  return (
    <PSEContextProvider context={context}>
      <Application
      />
    </PSEContextProvider>
  );
}

export default CIMEApp;