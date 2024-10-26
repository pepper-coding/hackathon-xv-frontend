import React from "react";
import { Card } from "antd";

export const AdvantagesSection = () => (
  <Card className="bg-gradient-to-r from-green-400 to-green-300 text-gray-700 text-center p-4 mt-5">
    <h2 className="text-2xl font-semibold mb-4" >Почему выбирают нас?</h2>
    <hr className="border-white mb-4" />
    <ul className="list-disc list-inside">
      <li className="text-lg" >Высококвалифицированные специалисты</li>
      <li className="text-lg" >Современное оборудование</li>
      <li className="text-lg" >Индивидуальный подход к каждому пациенту</li>
      <li className="text-lg" >Комфортабельные условия</li>
    </ul>
  </Card>
);