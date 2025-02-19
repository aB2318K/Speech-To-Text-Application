describe('login_page_test', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/login');
    });
    it('Should display Log In Form', () => {
        cy.get('form').should('exist');
        cy.get('input[type="email"]').should('exist');
        cy.get('input[type="password"]').should('exist');
        cy.get('button[type="submit"]').should('exist');
    })

    it('should not log in with empty credentials', () => {
        cy.get('button[type="submit"]').click();
        cy.get('.empty_error').should('be.visible').and('have.length', 2);
        cy.url().should('include', '/login');
    })

    it('should navigate to forgotten password page', () => {
        cy.get('a[href="/reset-password"]').click();
      
        cy.url().should('include', '/reset-password'); //check that were' on the right page
    })
    
    it('should navigate to sign up page', () => {
        cy.get('a[href="/signup"]').click();
      
        cy.url().should('include', '/signup'); //check that were' on the right page
    })
    
    it('should not log in with incorrect credentials', () => {
        cy.get('input[type="email"]').type('wrong@example.com');
        cy.get('input[type="password"]').type('wrongpassword');
      
        cy.get('button[type="submit"]').click();
      
        cy.contains('*This email address was not found. Please check for typos or create a new account.').should('exist');
        cy.get('input[type="email"]').clear().type('validEmail@example.com');
        cy.get('input[type="password"]').type('validPassword1!');
        cy.get('button[type="submit"]').click();
        cy.contains('*Incorrect password. Please try again or reset your password.').should('exist');
        cy.url().should('include', '/login');
    })

    it('Should successfully log in with correct credentials', () => {
        cy.get('input[type="email"]').type('validEmail@example.com');
        cy.get('input[type="password"]').type('validPassword1!');
        cy.get('button[type="submit"]').click();
        cy.contains('You have successfully logged in.');
        cy.url().should('include', '/dashboard');
    })
    
} )

