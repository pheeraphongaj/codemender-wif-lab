const adminService = require('../../services/admin.service');

function evaluateSafe(expression) {
    if (typeof expression !== 'string') {
        throw new Error('Expression must be a string');
    }
    if (expression.length > 500) {
        throw new Error('Expression too long');
    }
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
    }

    const tokens = expression.match(/\d+(\.\d+)?|[+\-*/()]/g) || [];
    let position = 0;

    function peek() {
        return tokens[position];
    }

    function consume(expected) {
        if (peek() === expected) {
            position++;
            return true;
        }
        return false;
    }

    function parsePrimary() {
        if (consume('+')) {
            return parsePrimary();
        }
        if (consume('-')) {
            return -parsePrimary();
        }
        const token = peek();
        if (token === '(') {
            position++; // consume '('
            const result = parseExpression();
            if (!consume(')')) {
                throw new Error('Unbalanced parentheses');
            }
            return result;
        }
        
        if (token && /^\d+(\.\d+)?$/.test(token)) {
            position++;
            return parseFloat(token);
        }
        
        throw new Error('Unexpected token: ' + token);
    }

    function parseMultiplicative() {
        let result = parsePrimary();
        while (true) {
            if (consume('*')) {
                result *= parsePrimary();
            } else if (consume('/')) {
                result /= parsePrimary();
            } else {
                break;
            }
        }
        return result;
    }

    function parseExpression() {
        let result = parseMultiplicative();
        while (true) {
            if (consume('+')) {
                result += parseMultiplicative();
            } else if (consume('-')) {
                result -= parseMultiplicative();
            } else {
                break;
            }
        }
        return result;
    }

    const value = parseExpression();
    if (position < tokens.length) {
        throw new Error('Unexpected extra tokens at end of expression');
    }
    return value;
}

exports.checkShippingStatus = (req, res) => {
    adminService.pingProvider(req.body.providerIP, req.body.options, out => res.send(out));
};

exports.previewDynamicPricing = (req, res) => {
    try {
        res.json({ price: evaluateSafe(req.body.formula) });
    } catch (e) {
        res.status(400).send("Evaluation Failed");
    }
};
