import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { BadRequestError } from '../errors/bad-request-error';
import 'express-async-errors';
import { validateRequest } from '../middlewares/validate-request';


const router = express.Router();

router.post('/api/users/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Invalid email'),
    body('password')
      .isLength({ min: 3})
      .withMessage('Password must be atleast 3 characters long')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError('email in use');
    }
    
    const user = User.build({ email, password });
    await user.save();

    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email
      }, 'asdf', {expiresIn: '30 days'}
    // }, process.env.JWT_KEY!
    );

    req.session = {
      jwt: userJwt
    };

    res.status(201).send(user);

  }
);

export { router as signupRouter };
