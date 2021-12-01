import React, { Ref, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { API, Application, DatasetType, IVector, PluginRegistry, PSEContextProvider, PSEPlugin, rootReducer, RootState, setDatasetEntriesAction } from 'projection-space-explorer';
import * as THREE from 'three'
import { GLHeatmap } from './GLHeatmap';
import { List, ListItem } from '@mui/material';
import { SoundPrint } from './SoundPrint';


export const DATASETCONFIG = [
  {
    display: "chess",
    path: "chess16k.csv",
    type: DatasetType.Chess

  },
  {
    display: "Cycle 0",
    path: "/jku-vds-lab/reaction-cime/datasets/reaction_optimization/no_suggestions/experiments_0.csv",
    type: DatasetType.Experiments_Only
  },
  {
    display: "Cycle 1",
    path: "/jku-vds-lab/reaction-cime/datasets/reaction_optimization/no_suggestions/experiments_1.csv",
    type: DatasetType.Experiments_Only
  },
  {
    display: "Cycle 2",
    path: "/jku-vds-lab/reaction-cime/datasets/reaction_optimization/no_suggestions/experiments_2.csv",
    type: DatasetType.Experiments_Only
  },
  {
    display: "Cycle 3",
    path: "/jku-vds-lab/reaction-cime/datasets/reaction_optimization/no_suggestions/experiments_3.csv",
    type: DatasetType.Experiments_Only
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
    new API<RootState>(null, rootReducer)

  const [context] = useState(
    api
  );


  api.store.dispatch(setDatasetEntriesAction(DATASETCONFIG))

  return (
    <PSEContextProvider context={context}>
      <Application
        config={{
          preselect: {
            url: 'chess16k.csv'
          }
        }}
        overrideComponents={{
          layers: [{
            order: -1,
            component: () => <GLHeatmap
              texture={new THREE.TextureLoader().load('test.jpg')}
              size={{
                x: 10,
                y: 10,
                width: 100,
                height: 100
              }}
            ></GLHeatmap>
          }]
        }}
      />
    </PSEContextProvider>
  );
}

export default CIMEApp;