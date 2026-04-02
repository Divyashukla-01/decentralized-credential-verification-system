package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing credentials
type SmartContract struct {
	contractapi.Contract
}

// Credential describes a student credential stored on-chain
type Credential struct {
	ID        string `json:"id"`
	StudentID string `json:"studentId"`
	Course    string `json:"course"`
	Grade     string `json:"grade"`
	IssuedAt  string `json:"issuedAt"`
	IssuerOrg string `json:"issuerOrg"`
}

// CreateCredential issues a new credential to the ledger
func (s *SmartContract) CreateCredential(ctx contractapi.TransactionContextInterface, id string, studentId string, course string, grade string, issuedAt string) error {
	exists, err := s.CredentialExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check credential existence: %v", err)
	}
	if exists {
		return fmt.Errorf("credential with ID %s already exists", id)
	}

	// Get the MSP ID of the submitting org
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		mspID = "UnknownOrg"
	}

	credential := Credential{
		ID:        id,
		StudentID: studentId,
		Course:    course,
		Grade:     grade,
		IssuedAt:  issuedAt,
		IssuerOrg: mspID,
	}

	credentialJSON, err := json.Marshal(credential)
	if err != nil {
		return fmt.Errorf("failed to marshal credential: %v", err)
	}

	err = ctx.GetStub().PutState(id, credentialJSON)
	if err != nil {
		return fmt.Errorf("failed to put state: %v", err)
	}

	// Emit an event
	_ = ctx.GetStub().SetEvent("CredentialCreated", credentialJSON)

	return nil
}

// ReadCredential retrieves a credential from the ledger by ID
func (s *SmartContract) ReadCredential(ctx contractapi.TransactionContextInterface, id string) (*Credential, error) {
	credentialJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if credentialJSON == nil {
		return nil, fmt.Errorf("credential with ID %s does not exist", id)
	}

	var credential Credential
	err = json.Unmarshal(credentialJSON, &credential)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal credential: %v", err)
	}

	return &credential, nil
}

// CredentialExists checks if a credential with the given ID exists
func (s *SmartContract) CredentialExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	credentialJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return credentialJSON != nil, nil
}

// GetAllCredentials returns all credentials stored in the ledger using CouchDB rich query
func (s *SmartContract) GetAllCredentials(ctx contractapi.TransactionContextInterface) ([]*Credential, error) {
	// Using CouchDB rich query to get all credentials
	queryString := `{"selector":{"id":{"$gt":null}}}`

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		// Fallback: use GetStateByRange for LevelDB
		return s.getAllByRange(ctx)
	}
	defer resultsIterator.Close()

	var credentials []*Credential
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next result: %v", err)
		}

		var credential Credential
		err = json.Unmarshal(queryResult.Value, &credential)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal credential: %v", err)
		}
		credentials = append(credentials, &credential)
	}

	if credentials == nil {
		credentials = []*Credential{}
	}

	return credentials, nil
}

// getAllByRange is a fallback for non-CouchDB state databases
func (s *SmartContract) getAllByRange(ctx contractapi.TransactionContextInterface) ([]*Credential, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var credentials []*Credential
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next result: %v", err)
		}

		var credential Credential
		err = json.Unmarshal(queryResponse.Value, &credential)
		if err != nil {
			// Skip malformed entries
			continue
		}
		credentials = append(credentials, &credential)
	}

	if credentials == nil {
		credentials = []*Credential{}
	}

	return credentials, nil
}

// DeleteCredential removes a credential from the ledger (admin only in production)
func (s *SmartContract) DeleteCredential(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := s.CredentialExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("credential with ID %s does not exist", id)
	}
	return ctx.GetStub().DelState(id)
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating credential chaincode: %v", err)
	}
	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting credential chaincode: %v", err)
	}
}
