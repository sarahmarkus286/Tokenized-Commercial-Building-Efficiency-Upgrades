import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockTxSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const mockBlockHeight = 100;

// Mock contract state
let contractState = {
  'contract-owner': mockTxSender,
  'next-contractor-id': 1,
  'contractors': {}
};

// Mock contract functions
const mockContractFunctions = {
  'register-contractor': (name, address, contact, specialties, licenseNumber) => {
    const contractorId = contractState['next-contractor-id'];
    
    // Check if contractor already exists
    if (contractState.contractors[contractorId]) {
      return { type: 'err', value: 101 }; // ERR-CONTRACTOR-EXISTS
    }
    
    // Add contractor to state
    contractState.contractors[contractorId] = {
      name,
      address,
      contact,
      specialties,
      'license-number': licenseNumber,
      'is-verified': false,
      'verification-date': 0,
      'registration-date': mockBlockHeight
    };
    
    // Increment contractor ID
    contractState['next-contractor-id'] += 1;
    
    return { type: 'ok', value: contractorId };
  },
  
  'verify-contractor': (contractorId) => {
    // Check if caller is contract owner
    if (mockTxSender !== contractState['contract-owner']) {
      return { type: 'err', value: 100 }; // ERR-NOT-AUTHORIZED
    }
    
    // Check if contractor exists
    if (!contractState.contractors[contractorId]) {
      return { type: 'err', value: 102 }; // ERR-CONTRACTOR-NOT-FOUND
    }
    
    // Verify contractor
    contractState.contractors[contractorId]['is-verified'] = true;
    contractState.contractors[contractorId]['verification-date'] = mockBlockHeight;
    
    return { type: 'ok', value: true };
  },
  
  'update-contractor': (contractorId, contact, specialties) => {
    // Check if contractor exists
    if (!contractState.contractors[contractorId]) {
      return { type: 'err', value: 102 }; // ERR-CONTRACTOR-NOT-FOUND
    }
    
    // Update contractor
    contractState.contractors[contractorId].contact = contact;
    contractState.contractors[contractorId].specialties = specialties;
    
    return { type: 'ok', value: true };
  },
  
  'get-contractor': (contractorId) => {
    if (!contractState.contractors[contractorId]) {
      return { type: 'none' };
    }
    return { type: 'some', value: contractState.contractors[contractorId] };
  },
  
  'is-contractor-verified': (contractorId) => {
    if (!contractState.contractors[contractorId]) {
      return false;
    }
    return contractState.contractors[contractorId]['is-verified'];
  },
  
  'get-contractor-count': () => {
    return contractState['next-contractor-id'] - 1;
  }
};

describe('Contractor Verification Contract', () => {
  beforeEach(() => {
    // Reset contract state before each test
    contractState = {
      'contract-owner': mockTxSender,
      'next-contractor-id': 1,
      'contractors': {}
    };
  });
  
  it('should register a new contractor', () => {
    const result = mockContractFunctions['register-contractor'](
        'EcoTech Solutions',
        '123 Green St',
        'contact@ecotech.com',
        'HVAC, Solar, Insulation',
        'LIC-12345'
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(1);
    expect(contractState['next-contractor-id']).toBe(2);
    expect(contractState.contractors[1]).toBeDefined();
    expect(contractState.contractors[1].name).toBe('EcoTech Solutions');
    expect(contractState.contractors[1]['is-verified']).toBe(false);
  });
  
  it('should verify a contractor', () => {
    // First register a contractor
    mockContractFunctions['register-contractor'](
        'EcoTech Solutions',
        '123 Green St',
        'contact@ecotech.com',
        'HVAC, Solar, Insulation',
        'LIC-12345'
    );
    
    // Then verify the contractor
    const result = mockContractFunctions['verify-contractor'](1);
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    expect(contractState.contractors[1]['is-verified']).toBe(true);
    expect(contractState.contractors[1]['verification-date']).toBe(mockBlockHeight);
  });
  
  it('should fail to verify a non-existent contractor', () => {
    const result = mockContractFunctions['verify-contractor'](999);
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(102); // ERR-CONTRACTOR-NOT-FOUND
  });
  
  it('should update contractor details', () => {
    // First register a contractor
    mockContractFunctions['register-contractor'](
        'EcoTech Solutions',
        '123 Green St',
        'contact@ecotech.com',
        'HVAC, Solar, Insulation',
        'LIC-12345'
    );
    
    // Then update the contractor
    const result = mockContractFunctions['update-contractor'](
        1,
        'new-contact@ecotech.com',
        'HVAC, Solar, Insulation, LED Lighting'
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    expect(contractState.contractors[1].contact).toBe('new-contact@ecotech.com');
    expect(contractState.contractors[1].specialties).toBe('HVAC, Solar, Insulation, LED Lighting');
  });
  
  it('should get contractor details', () => {
    // First register a contractor
    mockContractFunctions['register-contractor'](
        'EcoTech Solutions',
        '123 Green St',
        'contact@ecotech.com',
        'HVAC, Solar, Insulation',
        'LIC-12345'
    );
    
    const result = mockContractFunctions['get-contractor'](1);
    
    expect(result.type).toBe('some');
    expect(result.value.name).toBe('EcoTech Solutions');
    expect(result.value['license-number']).toBe('LIC-12345');
  });
  
  it('should check if contractor is verified', () => {
    // First register a contractor
    mockContractFunctions['register-contractor'](
        'EcoTech Solutions',
        '123 Green St',
        'contact@ecotech.com',
        'HVAC, Solar, Insulation',
        'LIC-12345'
    );
    
    expect(mockContractFunctions['is-contractor-verified'](1)).toBe(false);
    
    // Verify the contractor
    mockContractFunctions['verify-contractor'](1);
    
    expect(mockContractFunctions['is-contractor-verified'](1)).toBe(true);
  });
  
  it('should get the contractor count', () => {
    expect(mockContractFunctions['get-contractor-count']()).toBe(0);
    
    // Register two contractors
    mockContractFunctions['register-contractor'](
        'EcoTech Solutions',
        '123 Green St',
        'contact@ecotech.com',
        'HVAC, Solar, Insulation',
        'LIC-12345'
    );
    
    mockContractFunctions['register-contractor'](
        'Green Building Co',
        '456 Eco Ave',
        'info@greenbuilding.com',
        'Insulation, Windows, Roofing',
        'LIC-67890'
    );
    
    expect(mockContractFunctions['get-contractor-count']()).toBe(2);
  });
});
