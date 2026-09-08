import { Router } from 'express'
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from '../controllers/profileController.js'
import { authenticateToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.use(authenticateToken)

router.get('/me', getMyProfile)
router.put('/me', updateMyProfile)
router.put('/me/password', changeMyPassword)

export default router