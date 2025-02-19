describe('reset_page_test', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/reset-password');
    });
    it('Should have an email input field and a button', () => {
        cy.get('input[type="email"]').should('exist');
        cy.get('button[type="button"]').should('exist');
    })
    it('Should not let users submit invalid email', () => {
        cy.get('input[type="email"]').type('invalidEmail');
        cy.get('button[type="button"]').click();
        cy.get('.error_message').should('be.visible').and('contain', '*Please provide a valid email address in the format: example@domain.com');
    })

    it('Should not let users submit email not in database', () => {
        cy.get('input[type="email"]').type('testEmail@example.com');
        cy.get('button[type="button"]').click();
        cy.get('.error_message').should('be.visible').and('contain', '*Email not found. Please check for typos or create a new account.');
    })

    //Success message should only appear when the given email exists in the data base and the reset link has been sent.
    it('Should display success message when correct email is provided', () => {
        cy.get('input[type="email"]').type('validEmail@example.com');
        cy.get('button[type="button"]').click();
        cy.get('.success_message').should('be.visible').and('contain', 'A password reset link has been sent to your email');
    })

    it('Should navigate to log in page when log in link is clicked', () => {
        cy.get('a[href="/login"]').click();
      
        cy.url().should('include', '/login');
    })
    
} )

