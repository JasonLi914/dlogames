import React, { Component } from "react"
import gql from "graphql-tag"
import styled from "styled-components"
import { Mutation } from "react-apollo"

const GuessForm = styled.form`
  padding: 0 0.75rem;
  div[role="group"] {
    border: 0;
    display: flex;
    justify-content: space-evenly;
    margin-bottom: 0.5rem;
  }
  input {
    width: 30vw;
  }
  button[type="submit"] {
    background: gray;
    border: 0;
    border-radius: 8px;
    color: white;
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 10px auto 0;
    width: 130px;
  }
`

const SUBMIT_CLUE_MUTATION = gql`
  mutation SUBMIT_CLUE_MUTATION(
    $id: String!
    $clue: String!
    $numGuesses: Int!
  ) {
    submitClue(id: $id, clue: $clue, numGuesses: $numGuesses) {
      clue
      numGuesses
    }
  }
`

class GuessInfo extends Component {
  state = {
    clue: this.props.clue,
    numGuesses: this.props.numGuesses,
  }

  handleChange = e => {
    const { name, type, value } = e.target
    const val = type === "number" ? parseFloat(value) : value
    this.setState({ [name]: val })
  }

  render() {
    return (
      <Mutation
        mutation={SUBMIT_CLUE_MUTATION}
        variables={{
          id: this.props.id,
          clue: this.state.clue,
          numGuesses: this.state.numGuesses,
        }}
      >
        {(submitClue, { error }) => {
          if (error) return <p>Error: {error.message}</p>

          return (
            <GuessForm
              onSubmit={async e => {
                e.preventDefault()

                await submitClue()
              }}
            >
              <div role="group">
                <input
                  type="text"
                  name="clue"
                  id="clue"
                  placeholder="clue"
                  value={this.state.clue || ""}
                  required
                  onChange={this.handleChange}
                />
                <span>for</span>
                <input
                  type="number"
                  name="numGuesses"
                  id="numGuesses"
                  placeholder="# guesses"
                  value={this.state.numGuesses || ""}
                  required
                  onChange={this.handleChange}
                />
              </div>
              <button type="submit">Submit Clue</button>
            </GuessForm>
          )
        }}
      </Mutation>
    )
  }
}

export default GuessInfo
