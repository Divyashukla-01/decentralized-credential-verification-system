package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type Certificate struct {
	CertId      string `json:"certId"`
	RollNo      string `json:"rollNo"`
	Hash        string `json:"hash"`
	StudentName string `json:"studentName"`
	Course      string `json:"course"`
	IssueDate   string `json:"issueDate"`
	IssuerName  string `json:"issuerName"`
	IssuerOrg   string `json:"issuerOrg"`
	Timestamp   string `json:"timestamp"`
	TxId        string `json:"txId"`
}

func (s *SmartContract) IssueCertificate(ctx contractapi.TransactionContextInterface,
	certId string, rollNo string, hash string, studentName string,
	course string, issueDate string, issuerName string, timestamp string) error {

	existing, _ := ctx.GetStub().GetState(certId)
	if existing != nil {
		return fmt.Errorf("certificate %s already exists", certId)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		mspID = "Org1MSP"
	}

	txId := ctx.GetStub().GetTxID()

	cert := Certificate{
		CertId:      certId,
		RollNo:      rollNo,
		Hash:        hash,
		StudentName: studentName,
		Course:      course,
		IssueDate:   issueDate,
		IssuerName:  issuerName,
		IssuerOrg:   mspID,
		Timestamp:   timestamp,
		TxId:        txId,
	}

	certJSON, err := json.Marshal(cert)
	if err != nil {
		return fmt.Errorf("failed to marshal: %v", err)
	}

	return ctx.GetStub().PutState(certId, certJSON)
}

func (s *SmartContract) VerifyCertificate(ctx contractapi.TransactionContextInterface, certId string) (*Certificate, error) {
	certJSON, err := ctx.GetStub().GetState(certId)
	if err != nil {
		return nil, fmt.Errorf("failed to read: %v", err)
	}
	if certJSON == nil {
		return nil, fmt.Errorf("certificate %s does not exist", certId)
	}

	var cert Certificate
	err = json.Unmarshal(certJSON, &cert)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal: %v", err)
	}
	return &cert, nil
}

func (s *SmartContract) GetCertificateByRollNo(ctx contractapi.TransactionContextInterface, rollNo string) (*Certificate, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get state: %v", err)
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			continue
		}
		var cert Certificate
		err = json.Unmarshal(queryResponse.Value, &cert)
		if err != nil {
			continue
		}
		if cert.RollNo == rollNo {
			return &cert, nil
		}
	}
	return nil, fmt.Errorf("no certificate found for roll number: %s", rollNo)
}

func (s *SmartContract) GetAllCertificates(ctx contractapi.TransactionContextInterface) ([]*Certificate, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, fmt.Errorf("failed to get state: %v", err)
	}
	defer resultsIterator.Close()

	var certs []*Certificate
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			continue
		}
		var cert Certificate
		err = json.Unmarshal(queryResponse.Value, &cert)
		if err != nil {
			continue
		}
		certs = append(certs, &cert)
	}

	if certs == nil {
		certs = []*Certificate{}
	}
	return certs, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating chaincode: %v", err)
	}
	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting chaincode: %v", err)
	}
}
