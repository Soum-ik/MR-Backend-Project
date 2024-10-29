import { Router } from 'express'
import { startProject } from './start_project.controller'
import authenticate_for_startProject from './Start_project.middleware'

const router = Router()

router.put('/start-project', authenticate_for_startProject, startProject)


export const Start_Project_Controller = router