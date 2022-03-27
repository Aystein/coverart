import { List, ListItem } from "@mui/material"
import { IVector, RootState, setHoverState } from "projection-space-explorer"
import { useRef } from "react"
import { connect, ConnectedProps } from "react-redux"


const mapStateToProps = (state: RootState) => ({
    hover: state.hoverState
})

const mapDispatchToProps = (dispatch: any) => ({
    setHover: (hover: any) => dispatch(setHoverState(hover, 'soundfingerprint'))
})




const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>

type Props = PropsFromRedux & {
    vectors: IVector[]
    aggregate: boolean
}




export const SoundPrint = connector(({ vectors, aggregate, hover, setHover }: Props) => {
    const ref = useRef<HTMLAudioElement[]>([])

    

    if (vectors?.length) {
        const onMouseOver = (i: number) => {
            setHover(vectors[i])
        }

        const onMouseLeave = (i: number) => {
            setHover(null)
        }

        return <List sx={{
            '& audio': {
                width: 250
            },
            '& MuiListItem-root': {
                justifyContent: 'center'
            },
            flexGrow: 1,
            overflowY: 'auto'

        }}>
            {
                vectors.map((vec, i) => {
                    return <ListItem onMouseLeave={() => onMouseLeave(i)} onMouseOver={() => onMouseOver(i)} key={vec.__meta__.meshIndex}>
                        <audio ref={el => ref.current[i] = el!} controls autoPlay={false}>
                            <source src={`data:audio/wav;base64,${(vec as any)['wav']}`} />
                        </audio>
                    </ListItem>
                })
            }
        </List>
    }

    return <div>none</div>
})