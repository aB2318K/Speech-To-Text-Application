describe('Dashboard Page Test', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.visit('http://localhost:3000/login');
      cy.get('input[type="email"]').type('validEmail@example.com');
      cy.get('input[type="password"]').type('validPassword1!');
      cy.get('button[type="submit"]').click();
      cy.contains('You have successfully logged in.');
      cy.url().should('include', '/dashboard');
    });
  
    it('Should display the sidebar with navigation buttons', () => {
      cy.get('.side_bar').within(() => {
        cy.contains('Speech to Text Application').should('exist');
        cy.contains('Create New').should('exist');
        cy.contains('Profile').should('exist');
        cy.contains('Log Out').should('exist');
      });
    });
  
    it('Should navigate correctly using the sidebar links', () => {
        cy.contains('Create New').click();
        cy.url().should('include', '/create');
        cy.visit('http://localhost:3000/dashboard');
    
        cy.contains('Profile').click();
        cy.url().should('include', '/profile');
        cy.visit('http://localhost:3000/dashboard');
    
        cy.contains('Log Out').click();
        cy.url().should('include', '/login');
    });
  
  });
  