import React, { Component } from "react"
import { Mutation, Query } from "react-apollo"
import { navigate } from "@reach/router"
import { getProfile } from "../../utils/auth"
import { gameIdQuery } from "../../components/dlonames/DlonamesLobby"
import gql from "graphql-tag"
import GuessInfo from "./GuessInfo"
import TeamInfo from "./TeamInfo"
import Button, {
  blueTranslucent,
  redTranslucent,
  blackTranslucent,
  grayTranslucent,
  blue,
  red,
  black,
  gray,
} from "../styled/button"

const stage = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED",
}
export const BLUE_TEAM_STRING = "Blue"
export const RED_TEAM_STRING = "Red"
const ROWS_PER_GAME = 5
const WORDS_PER_ROW = 5

export const CREATE_GAME_MUTATION = gql`
  mutation CREATE_GAME_MUTATION($creatorName: String!) {
    createGame(creatorName: $creatorName) {
      id
    }
  }
`

export const JOIN_GAME_MUTATION = gql`
  mutation JOIN_GAME_MUTATION($username: String!, $id: String!) {
    joinGame(username: $username, id: $id) {
      id
    }
  }
`

export const GET_GAME_QUERY = gql`
  query GET_GAME_QUERY($id: ID!, $username: String) {
    game(id: $id, username: $username) {
      redCodemaster
      blueCodemaster
      redTeam
      blueTeam
      words
      blueWords
      redWords
      deathWord
      clue
      numGuesses
      wordsGuessed
      stage
      isUserJoined
    }
  }
`

const isUserOnATeam = (username, team1, team2) => {
  return new Set(team1).has(username) || new Set(team2).has(username)
}

class DlonamesBoard extends Component {
  render() {
    const currentUser = getProfile()
    let gameId = this.props.gameId

    if (!gameId) {
      return (
        <Mutation
          mutation={CREATE_GAME_MUTATION}
          variables={{ creatorName: currentUser.nickname }}
        >
          {(createGame, { loading, error }) => {
            if (loading) return <p>Creating game...</p>
            if (error) return <p>Error: {error.message}</p>
            return (
              <Button
                onClickHandler={async () => {
                  const createGameResponse = await createGame()
                  gameId = createGameResponse.data.createGame.id
                  navigate("/dlonames/game?" + gameIdQuery + "=" + gameId)
                }}
                label="Create Game"
                backgroundColor="grey"
              />
            )
          }}
        </Mutation>
      )
    }

    return (
      // TODO: Change the poll interval to be smaller closer to launch.
      <Query
        query={GET_GAME_QUERY}
        variables={{ id: gameId, username: currentUser.nickname }}
        pollInterval={5000}
      >
        {({ data, loading, error }) => {
          if (loading) return <p>Loading game...</p>
          if (error) return <p>Error: ${error.message}</p>

          const {
            words,
            redCodemaster,
            blueCodemaster,
            redTeam,
            blueTeam,
            blueWords,
            redWords,
            deathWord,
            clue,
            numGuesses,
            wordsGuessed,
            stage,
          } = data.game

          if (
            !isUserOnATeam(
              currentUser.nickname.toLowerCase(),
              redTeam,
              blueTeam
            )
          ) {
            return (
              <Mutation
                mutation={JOIN_GAME_MUTATION}
                variables={{ username: currentUser.nickname, id: gameId }}
              >
                {(joinGame, { loading, error }) => {
                  if (loading) return <p>Joining game...</p>
                  if (error) return <p>Error: {error.message}</p>
                  return (
                    <Button
                      onClickHandler={async () => {
                        await joinGame()
                      }}
                      label="Join Game"
                      backgroundColor="grey"
                    />
                  )
                }}
              </Mutation>
            )
          }

          const rows = []
          for (let i = 0; i < ROWS_PER_GAME; i++) {
            const firstIndexOfRow = i * ROWS_PER_GAME
            const rowWords = words.slice(
              firstIndexOfRow,
              firstIndexOfRow + WORDS_PER_ROW
            )
            rows.push(
              <Row
                key={rowWords.join("")}
                words={rowWords}
                blueWords={blueWords}
                redWords={redWords}
                deathWord={deathWord}
                wordsGuessed={wordsGuessed}
                id={gameId}
              />
            )
          }
          return (
            <React.Fragment>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  padding: ".5rem",
                }}
              >
                <TeamInfo
                  teamColor={BLUE_TEAM_STRING}
                  codeMaster={blueCodemaster}
                  teamMembers={blueTeam}
                />
                <TeamInfo
                  teamColor={RED_TEAM_STRING}
                  codeMaster={redCodemaster}
                  teamMembers={redTeam}
                />
              </div>
              <GuessInfo id={gameId} clue={clue} numGuesses={numGuesses} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-evenly",
                  margin: "0 -.75rem",
                }}
              >
                {/* Refactor this to use context providers or hooks instead of big lists of props. */}
                {rows}
              </div>
            </React.Fragment>
          )
        }}
      </Query>
    )
  }
}

export const GUESS_WORD_MUTATION = gql`
  mutation GUESS_WORD_MUTATION($id: String!, $wordGuessed: String!) {
    guessWord(id: $id, word: $wordGuessed) {
      numGuesses
      wordsGuessed
    }
  }
`

const isCurrentUserCodemaster = () =>
  // TODO(david): Dynamically determine this based on user and response from server
  true

const getColorForWord = (
  word,
  blueWords,
  redWords,
  deathWord,
  wordsGuessed
) => {
  let wordHasBeenGuessed = false
  if (new Set(wordsGuessed).has(word)) {
    wordHasBeenGuessed = true
  }
  if (!isCurrentUserCodemaster()) {
    if (!wordHasBeenGuessed) return grayTranslucent
  }
  if (new Set(blueWords).has(word)) {
    return wordHasBeenGuessed ? blue : blueTranslucent
  }
  if (new Set(redWords).has(word)) {
    return wordHasBeenGuessed ? red : redTranslucent
  }
  if (word === deathWord) {
    return wordHasBeenGuessed ? black : blackTranslucent
  }
  return wordHasBeenGuessed ? gray : grayTranslucent
}

const Row = ({ words, blueWords, redWords, deathWord, id, wordsGuessed }) => (
  <Mutation
    mutation={GUESS_WORD_MUTATION}
    variables={{
      id: id,
    }}
  >
    {(guessWord, { error }) => {
      if (error) return <p>error: {error.message}</p>

      const buttons = []
      for (let i = 0; i < WORDS_PER_ROW; i++) {
        buttons.push(
          <Button
            key={words[i]}
            label={words[i]}
            onClickHandler={e =>
              guessWord({
                variables: {
                  wordGuessed: e.target.value,
                },
              })
            }
            backgroundColor={getColorForWord(
              words[i],
              blueWords,
              redWords,
              deathWord,
              wordsGuessed
            )}
          />
        )
      }
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            paddingTop: "2vh",
          }}
        >
          {buttons}
        </div>
      )
    }}
  </Mutation>
)

export default DlonamesBoard
